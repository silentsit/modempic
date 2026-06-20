/**
 * Import WooCommerce users + orders exported as CSV into Modempic (Prisma / Postgres).
 *
 * Expected CSV layout matches WT/WooCommerce order export + user CSV from wp-admin.
 * Default paths are adjacent to `web/` (repo root).
 *
 * Usage (from `web/` with DATABASE_URL in `.env` / `.env.local`):
 *   dotenv -e .env -e .env.local -- npx tsx scripts/import-noofox-users-orders.ts           # dry-run
 *   dotenv -e .env -e .env.local -- npx tsx scripts/import-noofox-users-orders.ts --apply     # write DB
 *
 * Options:
 *   --users path/to/user-export.csv
 *   --orders path/to/order-export.csv
 *   --apply                  Persist users + orders (otherwise counts only)
 *   --skip-users             Do not update user rows; load existing users by CSV email and import orders only
 *   --order-ids id1,id2      Import only these WooCommerce order_id values (comma-separated)
 *
 * Idempotency: safe to re-run with `--apply`. Existing orders with orderNumber `NF-{woo_order_id}` are skipped.
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import {
  CryptoAsset,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ProductStatus,
  Role,
} from "@prisma/client";

/** Load `.env.local` then `.env` into `process.env` when keys are unset (works without dotenv-cli on PATH). */
function bootstrapEnvFromFiles() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const fp = path.join(root, name);
    if (!fs.existsSync(fp)) continue;
    const txt = fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, "");
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

bootstrapEnvFromFiles();

const prisma = new PrismaClient();

const NF_ORDER_PREFIX = "NF-";

function repoRootDir(): string {
  return path.resolve(process.cwd(), "..");
}

function args() {
  const argv = process.argv.slice(2);
  let usersCsv = path.join(repoRootDir(), "user-export-2026-05-10-10-47-43.csv");
  let ordersCsv = path.join(repoRootDir(), "order-export-2026-05-10-10-50-03.csv");
  let apply = false;
  let skipUsers = false;
  let orderIds: string[] | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") apply = true;
    else if (a === "--skip-users") skipUsers = true;
    else if (a === "--users") usersCsv = path.resolve(argv[++i] ?? "");
    else if (a === "--orders") ordersCsv = path.resolve(argv[++i] ?? "");
    else if (a === "--order-ids") {
      orderIds = (argv[++i] ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
  }
  return { usersCsv, ordersCsv, apply, skipUsers, orderIds };
}

function readCsvRecords(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
  return rows;
}

function isLineItemOrderExport(rows: Record<string, string>[]): boolean {
  const first = rows[0];
  return Boolean(first && "Order Number" in first && "Email (Billing)" in first && "Item Name" in first);
}

function dateToImportString(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
  ].join("-") + ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  return values.map((v) => (v ?? "").trim()).find(Boolean) ?? "";
}

function numberString(v: string | undefined): string {
  return (v ?? "").replace(/,/g, "").trim();
}

function normalizeLineItemOrderExport(rows: Record<string, string>[]): Record<string, string>[] {
  const grouped = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const orderNumber = String(row["Order Number"] ?? "").trim();
    if (!orderNumber) continue;
    const existing = grouped.get(orderNumber);
    if (existing) existing.push(row);
    else grouped.set(orderNumber, [row]);
  }

  const normalized: Record<string, string>[] = [];
  for (const [orderNumber, lines] of grouped) {
    const first = lines[0];
    const row: Record<string, string> = {
      order_id: orderNumber,
      order_number: orderNumber,
      order_date: dateToImportString(first["Order Date"]),
      status: first["Order Status"] ?? "",
      shipping_total: numberString(first["Order Shipping Amount"]),
      tax_total: numberString(first["Order Total Tax Amount"]),
      discount_total: firstNonEmpty(first["Cart Discount Amount"], first["Discount Amount"]),
      order_total: numberString(first["Order Total Amount"]),
      order_subtotal: numberString(first["Order Subtotal Amount"]),
      order_currency: "USD",
      payment_method: first["Payment Method Title"] ?? "",
      payment_method_title: first["Payment Method Title"] ?? "",
      transaction_id: "",
      shipping_method: first["Shipping Method Title"] ?? "",
      customer_id: "",
      customer_email: first["Email (Billing)"] ?? "",
      billing_email: first["Email (Billing)"] ?? "",
      billing_first_name: first["First Name (Billing)"] ?? "",
      billing_last_name: first["Last Name (Billing)"] ?? "",
      billing_company: first["Company (Billing)"] ?? "",
      billing_phone: first["Phone (Billing)"] ?? "",
      billing_address_1: first["Address 1&2 (Billing)"] ?? "",
      billing_city: first["City (Billing)"] ?? "",
      billing_state: first["State Code (Billing)"] ?? "",
      billing_postcode: first["Postcode (Billing)"] ?? "",
      billing_country: first["Country Code (Billing)"] ?? "",
      shipping_first_name: first["First Name (Shipping)"] ?? "",
      shipping_last_name: first["Last Name (Shipping)"] ?? "",
      shipping_address_1: first["Address 1&2 (Shipping)"] ?? "",
      shipping_city: first["City (Shipping)"] ?? "",
      shipping_state: first["State Code (Shipping)"] ?? "",
      shipping_postcode: first["Postcode (Shipping)"] ?? "",
      shipping_country: first["Country Code (Shipping)"] ?? "",
      customer_note: first["Customer Note"] ?? "",
      order_notes: "",
    };

    lines.slice(0, 6).forEach((line, idx) => {
      const i = idx + 1;
      const qty = Number.parseInt(numberString(line["Quantity (- Refund)"]), 10) || 0;
      const unitCents = moneyToCents(line["Item Cost"]);
      const lineTotal = ((unitCents * Math.max(qty, 0)) / 100).toFixed(2);
      row[`Product Item ${i} Name`] = line["Item Name"] ?? "";
      row[`Product Item ${i} id`] = line["Item #"] ?? "";
      row[`Product Item ${i} SKU`] = line.SKU ?? "";
      row[`Product Item ${i} Quantity`] = String(qty);
      row[`Product Item ${i} Total`] = lineTotal;
      row[`Product Item ${i} Subtotal`] = lineTotal;
    });

    normalized.push(row);
  }

  return normalized;
}

function normalizeOrderRows(rows: Record<string, string>[]): Record<string, string>[] {
  if (isLineItemOrderExport(rows)) {
    const normalized = normalizeLineItemOrderExport(rows);
    console.log(`Detected line-item order export; collapsed ${rows.length} rows into ${normalized.length} orders.`);
    return normalized;
  }
  return rows;
}

function lowerEmail(s: string | undefined | null): string | null {
  const t = (s ?? "").trim().toLowerCase();
  if (!t || !t.includes("@")) return null;
  return t;
}

function normalizeNameKey(first: string | undefined, last: string | undefined): string | null {
  const key = [first, last]
    .map((v) => (v ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
  return key || null;
}

function buildUserEmailByName(userRows: Record<string, string>[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of userRows) {
    const email = lowerEmail(row.user_email ?? row.email ?? row.billing_email);
    if (!email) continue;
    const keys = [
      normalizeNameKey(row.first_name, row.last_name),
      normalizeNameKey(row.billing_first_name, row.billing_last_name),
      normalizeNameKey(row.display_name?.split(" ")[0], row.display_name?.split(" ").slice(1).join(" ")),
    ].filter(Boolean) as string[];
    for (const key of keys) {
      if (!map.has(key)) map.set(key, email);
    }
  }
  return map;
}

/** Legacy WT exports sometimes place email in billing_company or other shifted columns. */
function resolveOrderEmail(
  row: Record<string, string>,
  userEmailByName: Map<string, string>,
): string | null {
  const direct =
    lowerEmail(row.billing_email) ??
    lowerEmail(row.customer_email) ??
    lowerEmail(row.shipping_email) ??
    lowerEmail(row.billing_company) ??
    lowerEmail(row.customer_user);
  if (direct) return direct;

  const nameKey = normalizeNameKey(row.billing_first_name, row.billing_last_name);
  if (nameKey) {
    const fromUser = userEmailByName.get(nameKey);
    if (fromUser) return fromUser;
  }

  for (const val of Object.values(row)) {
    const email = lowerEmail(val);
    if (email) return email;
  }
  return null;
}

/** WP bcrypt hashes are prefixed with `$wp$`; Node bcrypt expects `$2y$…`. */
function normalizeWpPasswordHash(h: string | undefined | null): string | undefined {
  const t = (h ?? "").trim();
  if (!t || t.length < 10) return undefined;
  return t.replace(/^\$wp\$/, "");
}

function moneyToCents(v: string | undefined | null): number {
  if (v == null || v === "") return 0;
  const n = Number.parseFloat(String(v).replace(/,/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function mapOrderStatus(raw: string): OrderStatus {
  const x = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^wc-/, "");
  switch (x) {
    case "pending":
    case "pending payment":
      return OrderStatus.PENDING_PAYMENT;
    case "processing":
      return OrderStatus.PROCESSING;
    case "on-hold":
    case "on hold":
      return OrderStatus.ON_HOLD;
    case "completed":
      return OrderStatus.COMPLETED;
    case "cancelled":
      return OrderStatus.CANCELLED;
    case "refunded":
      return OrderStatus.REFUNDED;
    case "failed":
      return OrderStatus.FAILED;
    case "draft":
      return OrderStatus.DRAFT;
    default:
      return OrderStatus.COMPLETED;
  }
}

function mapPaymentStatus(orderStatus: OrderStatus, txId: string): PaymentStatus {
  if (orderStatus === OrderStatus.COMPLETED) return PaymentStatus.SUCCEEDED;
  if (orderStatus === OrderStatus.REFUNDED) return PaymentStatus.REFUNDED;
  if (orderStatus === OrderStatus.CANCELLED || orderStatus === OrderStatus.FAILED) return PaymentStatus.FAILED;
  if (orderStatus === OrderStatus.PROCESSING && txId.trim()) return PaymentStatus.SUCCEEDED;
  if (orderStatus === OrderStatus.PENDING_PAYMENT) return PaymentStatus.PENDING;
  return PaymentStatus.PENDING;
}

function detectPaymentMethod(pm: string): PaymentMethod {
  const p = (pm ?? "").toLowerCase();
  if (
    p.includes("stripe") ||
    p.includes("card") ||
    p.includes("guardarian") ||
    p.includes("onramp") ||
    p.includes("paypal")
  ) {
    return PaymentMethod.CARD_ONRAMP;
  }
  return PaymentMethod.CRYPTO;
}

function parseRole(rolesRaw: string): Role {
  const r = (rolesRaw ?? "").toLowerCase();
  if (r.includes("administrator")) return Role.ADMIN;
  if (r.includes("shop_manager") || r.includes("editor") || r.includes("author")) return Role.STAFF;
  return Role.CUSTOMER;
}

type DerivedOrderCounts = {
  byCustomerId: Map<string, number>;
  byEmail: Map<string, number>;
  noIdentity: number;
};

function incrementCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function deriveOrderCounts(
  orderRows: Record<string, string>[],
  userEmailByName: Map<string, string>,
): DerivedOrderCounts {
  const byCustomerId = new Map<string, number>();
  const byEmail = new Map<string, number>();
  let noIdentity = 0;

  for (const row of orderRows) {
    const customerId = String(row.customer_id ?? "").trim();
    const email = resolveOrderEmail(row, userEmailByName);

    if (customerId && customerId !== "0") {
      incrementCount(byCustomerId, customerId);
    } else if (email) {
      incrementCount(byEmail, email);
    } else {
      noIdentity++;
    }
  }

  return { byCustomerId, byEmail, noIdentity };
}

function printDerivedOrderCountSummary(counts: DerivedOrderCounts) {
  const derivedTotal =
    Array.from(counts.byCustomerId.values()).reduce((sum, n) => sum + n, 0) +
    Array.from(counts.byEmail.values()).reduce((sum, n) => sum + n, 0);

  console.log("\nNoofox past-order count summary:");
  console.log(`  Order CSV rows with registered customer_id: ${counts.byCustomerId.size} customers`);
  console.log(`  Order CSV guest/email-only customers: ${counts.byEmail.size} emails`);
  console.log(`  Order CSV rows without customer_id or email: ${counts.noIdentity}`);
  console.log(`  Derived order total from order CSV: ${derivedTotal}`);
}

function normalizeProductTitle(s: string): string {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/[—–−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Strip WooCommerce price tail from exported line title. */
function baseLineTitle(csvLineName: string): string {
  const first = csvLineName.split(/\s[—–−]\s/)[0]?.trim() ?? csvLineName.trim();
  return normalizeProductTitle(first);
}

type SlimProduct = { id: string; name: string; norm: string };

function createMatcher(products: { id: string; name: string }[]) {
  const slim: SlimProduct[] = products
    .filter((p) => !p.name.startsWith("Imported line item"))
    .map((p) => ({ id: p.id, name: p.name, norm: normalizeProductTitle(p.name) }))
    .sort((a, b) => b.norm.length - a.norm.length);

  let placeholderId = "";

  async function initPlaceholder() {
    const ph = await prisma.product.upsert({
      where: { slug: "_woo_import_unmatched" },
      create: {
        slug: "_woo_import_unmatched",
        name: "Imported line item (unmatched)",
        shortDesc: "Historical migration placeholder",
        longDesc:
          "This product is used when a WooCommerce order line could not be matched to a Modempic catalog product by name.",
        priceCents: 0,
        status: ProductStatus.PUBLISHED,
      },
      update: {},
    });
    placeholderId = ph.id;
    return placeholderId;
  }

  function match(lineTitle: string): string {
    const nb = baseLineTitle(lineTitle);
    if (!nb) return placeholderId;
    for (const p of slim) {
      if (!p.norm) continue;
      if (nb === p.norm) return p.id;
      if (nb.startsWith(p.norm) || p.norm.startsWith(nb)) return p.id;
    }
    for (const p of slim) {
      if (!p.norm) continue;
      if (nb.includes(p.norm) || p.norm.includes(nb)) return p.id;
    }
    return placeholderId;
  }

  return { initPlaceholder, match, getPlaceholderId: () => placeholderId };
}

function addrField(v: string | undefined, fallback: string): string {
  const t = (v ?? "").trim();
  return t || fallback;
}

async function main() {
  const { usersCsv, ordersCsv, apply, skipUsers, orderIds } = args();

  if (!fs.existsSync(usersCsv)) {
    console.error(`Users CSV not found: ${usersCsv}`);
    process.exit(1);
  }
  if (!fs.existsSync(ordersCsv)) {
    console.error(`Orders CSV not found: ${ordersCsv}`);
    process.exit(1);
  }

  const userRows = readCsvRecords(usersCsv);
  const rawOrderRows = readCsvRecords(ordersCsv);
  let orderRows = normalizeOrderRows(rawOrderRows);
  const userEmailByName = buildUserEmailByName(userRows);
  if (orderIds?.length) {
    const allow = new Set(orderIds);
    orderRows = orderRows.filter((row) => allow.has(String(row.order_id ?? "").trim()));
    console.log(`Filtering to ${orderRows.length} order(s): ${orderIds.join(", ")}`);
  }
  const derivedOrderCounts = deriveOrderCounts(orderRows, userEmailByName);

  console.log(`Users CSV: ${usersCsv} (${userRows.length} rows)`);
  console.log(`Orders CSV: ${ordersCsv} (${rawOrderRows.length} rows, ${orderRows.length} importable orders)`);
  console.log(`Mode: ${apply ? "APPLY (writes database)" : "DRY-RUN"}`);
  if (skipUsers) console.log("Users: skip updates; loading existing users by CSV email.");
  printDerivedOrderCountSummary(derivedOrderCounts);

  if (!apply) {
    console.log("\nDry-run complete. Re-run with --apply after verifying DATABASE_URL.");
    await prisma.$disconnect();
    return;
  }

  async function connectWithRetry() {
    for (let i = 0; i < 5; i++) {
      try {
        await prisma.$connect();
        console.log("Database connection OK.");
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`DB connect attempt ${i + 1}/5 failed: ${msg}`);
        await prisma.$disconnect().catch(() => {});
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
    }
    throw new Error("Could not connect to DATABASE_URL after retries (Neon offline or wrong URL?).");
  }

  await connectWithRetry();

  const wcUserIdToModempicId = new Map<string, string>();
  const emailToUserId = new Map<string, string>();

  let usersCreated = 0;
  let usersUpdated = 0;
  let userErrors = 0;

  if (skipUsers) {
    const csvUsers = userRows
      .map((row) => ({
        wcId: String(row.ID ?? row.id ?? "").trim(),
        email: lowerEmail(row.user_email),
      }))
      .filter((u): u is { wcId: string; email: string } => Boolean(u.email));
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: csvUsers.map((u) => u.email) } },
      select: { id: true, email: true },
    });
    const existingByEmail = new Map(existingUsers.flatMap((u) => (u.email ? [[u.email.toLowerCase(), u.id] as const] : [])));
    for (const u of csvUsers) {
      const id = existingByEmail.get(u.email);
      if (!id) continue;
      emailToUserId.set(u.email, id);
      if (u.wcId) wcUserIdToModempicId.set(u.wcId, id);
    }
    console.log(`\nUsers: loaded=${emailToUserId.size} from database; updates skipped`);
  } else {
    console.log(`Importing ${userRows.length} users (this can take a minute on a remote DB)…`);

    for (let ui = 0; ui < userRows.length; ui++) {
      const row = userRows[ui];
      try {
        const wcId = String(row.ID ?? row.id ?? "").trim();
        const email = lowerEmail(row.user_email);
        if (!email) {
          userErrors++;
          continue;
        }

        const name =
          [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
          row.display_name?.trim() ||
          row.user_login?.trim() ||
          email.split("@")[0];
        const role = parseRole(row.roles ?? "");
        const pwd = normalizeWpPasswordHash(row.user_pass);

        try {
          const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true },
          });

          if (existing && (existing.role === Role.ADMIN || existing.role === Role.STAFF)) {
            wcUserIdToModempicId.set(wcId, existing.id);
            emailToUserId.set(email, existing.id);
            continue;
          }

          const user = await prisma.user.upsert({
            where: { email },
            create: {
              email,
              name,
              role,
              emailVerified: new Date(),
              ...(pwd ? { passwordHash: pwd } : {}),
            },
            update: {
              name,
              ...(pwd ? { passwordHash: pwd } : {}),
            },
          });

          wcUserIdToModempicId.set(wcId, user.id);
          emailToUserId.set(email, user.id);

          try {
            await prisma.cart.upsert({
              where: { userId: user.id },
              create: { userId: user.id },
              update: {},
            });
          } catch (cartErr) {
            console.warn(`Cart upsert skipped (${email}):`, cartErr instanceof Error ? cartErr.message : cartErr);
          }

          if (existing) usersUpdated++;
          else usersCreated++;
        } catch (e) {
          userErrors++;
          console.warn(`User import failed (${email}):`, e instanceof Error ? e.message : e);
        }
      } finally {
        const n = ui + 1;
        if (n % 75 === 0 || n === userRows.length) {
          console.log(`  Users progress: ${n}/${userRows.length}`);
        }
      }
    }

    console.log(`\nUsers: created=${usersCreated} touched=${usersUpdated} skipped/errors=${userErrors}`);
  }

  console.log("Loading products for line-item matching…");
  const catalog = await prisma.product.findMany({
    select: { id: true, name: true },
  });
  const matcher = createMatcher(catalog);
  await matcher.initPlaceholder();

  let ordersImported = 0;
  let ordersSkipped = 0;
  let orderErrors = 0;
  let linesImported = 0;
  let unmatchedLines = 0;

  console.log(`Importing ${orderRows.length} orders…`);

  for (let oi = 0; oi < orderRows.length; oi++) {
    const row = orderRows[oi];
    const wooOrderId = String(row.order_id ?? "").trim();
    const orderNumber = `${NF_ORDER_PREFIX}${wooOrderId}`;

    try {
      const exists = await prisma.order.findUnique({
        where: { orderNumber },
        select: { id: true },
      });
      if (exists) {
        ordersSkipped++;
        continue;
      }

      const billingEmail = resolveOrderEmail(row, userEmailByName);

      if (!billingEmail) {
        orderErrors++;
        console.warn(`Order ${wooOrderId}: no billing/customer email — skipped`);
        continue;
      }

      const cid = String(row.customer_id ?? "").trim();
      let userId = (cid && cid !== "0" ? wcUserIdToModempicId.get(cid) : undefined) ?? emailToUserId.get(billingEmail);

      if (!userId) {
        const guestName =
          [row.billing_first_name, row.billing_last_name].filter(Boolean).join(" ").trim() || billingEmail.split("@")[0];
        const guest = await prisma.user.upsert({
          where: { email: billingEmail },
          create: {
            email: billingEmail,
            name: guestName,
            role: Role.CUSTOMER,
            emailVerified: new Date(),
          },
          update: { name: guestName },
        });
        userId = guest.id;
        emailToUserId.set(billingEmail, userId);
        try {
          await prisma.cart.upsert({
            where: { userId: guest.id },
            create: { userId: guest.id },
            update: {},
          });
        } catch (cartErr) {
          console.warn(`Cart upsert skipped (guest ${billingEmail}):`, cartErr instanceof Error ? cartErr.message : cartErr);
        }
      }

      const shipMethod = (row.shipping_method ?? "").trim() || null;
      const orderDate = row.order_date ? new Date(row.order_date.replace(" ", "T")) : new Date();
      const status = mapOrderStatus(row.status ?? "");
      const subtotalCents = moneyToCents(row.order_subtotal);
      const shippingCents = moneyToCents(row.shipping_total);
      const taxCents = moneyToCents(row.tax_total);
      const discountCents = moneyToCents(row.discount_total);
      const totalCents = moneyToCents(row.order_total);

      const billingFull = [row.billing_first_name, row.billing_last_name].filter(Boolean).join(" ").trim() || "Customer";
      const shippingFull =
        [row.shipping_first_name, row.shipping_last_name].filter(Boolean).join(" ").trim() || billingFull;

      const notesParts = [
        row.customer_note?.trim(),
        row.order_notes?.trim(),
        row.order_key ? `Woo order_key: ${row.order_key}` : "",
        row.wt_import_key ? `WT import key: ${row.wt_import_key}` : "",
      ].filter(Boolean);
      const adminNote = notesParts.join("\n---\n").slice(0, 4900);

      const deviceType = row["meta:_wc_order_attribution_device_type"]?.trim() || null;
      const originReferrer = row["meta:_wc_order_attribution_referrer"]?.trim() || null;
      const originSource = row["meta:_wc_order_attribution_source_type"]?.trim() || null;
      const sessionRaw = row["meta:_wc_order_attribution_session_pages"]?.trim();
      const sessionParsed = sessionRaw ? Number.parseInt(sessionRaw, 10) : NaN;
      const sessionPageViews = Number.isFinite(sessionParsed) ? sessionParsed : null;

      const pmRaw = row.payment_method ?? "";
      const txId = (row.transaction_id ?? "").trim();
      const payMethod = detectPaymentMethod(pmRaw);
      const payStatus = mapPaymentStatus(status, txId);

      const lineCreates: {
        productId: string;
        title: string;
        unitPriceCents: number;
        quantity: number;
        lineTotalCents: number;
      }[] = [];

      for (let i = 1; i <= 6; i++) {
        const title = row[`Product Item ${i} Name`]?.trim();
        if (!title) continue;
        const qty = Number.parseInt(row[`Product Item ${i} Quantity`] ?? "0", 10) || 0;
        if (qty <= 0) continue;
        const lineTotal = moneyToCents(row[`Product Item ${i} Total`]);
        const unitPriceCents = qty > 0 ? Math.round(lineTotal / qty) : lineTotal;
        const productId = matcher.match(title);
        if (productId === matcher.getPlaceholderId()) unmatchedLines++;
        lineCreates.push({
          productId,
          title,
          unitPriceCents,
          quantity: qty,
          lineTotalCents: lineTotal,
        });
      }

      if (lineCreates.length === 0) {
        const fallbackTitle = "Imported order (no line items in CSV)";
        lineCreates.push({
          productId: matcher.getPlaceholderId(),
          title: fallbackTitle,
          unitPriceCents: Math.max(0, subtotalCents),
          quantity: 1,
          lineTotalCents: Math.max(0, subtotalCents),
        });
        unmatchedLines++;
      }

      await prisma.$transaction(
        async (tx) => {
          const billingAddr = await tx.address.create({
            data: {
              userId,
              label: "Billing (import)",
              fullName: billingFull,
              line1: addrField(row.billing_address_1, "—"),
              line2: row.billing_address_2?.trim() || null,
              city: addrField(row.billing_city, "—"),
              state: addrField(row.billing_state, "—"),
              postal: addrField(row.billing_postcode, "00000"),
              country: addrField(row.billing_country, "US").toUpperCase().slice(0, 3),
              phone: row.billing_phone?.trim() || null,
            },
          });

          const shippingAddr = await tx.address.create({
            data: {
              userId,
              label: "Shipping (import)",
              fullName: shippingFull,
              line1: addrField(row.shipping_address_1, addrField(row.billing_address_1, "—")),
              line2: row.shipping_address_2?.trim() || row.billing_address_2?.trim() || null,
              city: addrField(row.shipping_city, addrField(row.billing_city, "—")),
              state: addrField(row.shipping_state, addrField(row.billing_state, "—")),
              postal: addrField(row.shipping_postcode, addrField(row.billing_postcode, "00000")),
              country: addrField(row.shipping_country, addrField(row.billing_country, "US"))
                .toUpperCase()
                .slice(0, 3),
              phone: row.shipping_phone?.trim() || row.billing_phone?.trim() || null,
            },
          });

          const order = await tx.order.create({
            data: {
              orderNumber,
              userId,
              status,
              subtotalCents,
              taxCents,
              shippingCents,
              discountCents,
              totalCents,
              currency: (row.order_currency ?? "USD").trim() || "USD",
              notes: null,
              adminNote: adminNote || null,
              shippingAddressId: shippingAddr.id,
              billingAddressId: billingAddr.id,
              shippingMethod: shipMethod,
              trackingNumber: null,
              trackingCarrier: null,
              originSource,
              originReferrer,
              deviceType,
              customerIp: row.customer_ip_address?.trim() || null,
              sessionPageViews,
              createdAt: orderDate,
              lines: {
                create: lineCreates,
              },
            },
          });

          await tx.payment.create({
            data: {
              orderId: order.id,
              method: payMethod,
              status: payStatus,
              idempotencyKey: `noofox-import-${wooOrderId}`,
              amountCents: totalCents,
              currency: (row.order_currency ?? "USD").trim() || "USD",
              provider: pmRaw || "woocommerce_import",
              externalId: txId || null,
              asset: payMethod === PaymentMethod.CRYPTO ? CryptoAsset.BTC : null,
            },
          });
        },
        { timeout: 120_000, maxWait: 60_000 },
      );

      ordersImported++;
      linesImported += lineCreates.length;
    } catch (e) {
      orderErrors++;
      console.warn(`Order ${wooOrderId}:`, e instanceof Error ? e.message : e);
    } finally {
      const on = oi + 1;
      if (on % 50 === 0 || on === orderRows.length) {
        console.log(
          `  Orders progress: ${on}/${orderRows.length} (imported=${ordersImported} skipped=${ordersSkipped} errors=${orderErrors})`,
        );
      }
    }
  }

  console.log(
    `\nOrders: imported=${ordersImported} skipped(existing)=${ordersSkipped} errors=${orderErrors} lines=${linesImported} unmatchedLines=${unmatchedLines}`,
  );
  console.log("\nDone.");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
