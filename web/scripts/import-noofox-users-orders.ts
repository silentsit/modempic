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
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") apply = true;
    else if (a === "--users") usersCsv = path.resolve(argv[++i] ?? "");
    else if (a === "--orders") ordersCsv = path.resolve(argv[++i] ?? "");
  }
  return { usersCsv, ordersCsv, apply };
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

function lowerEmail(s: string | undefined | null): string | null {
  const t = (s ?? "").trim().toLowerCase();
  return t ? t : null;
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
      return OrderStatus.PENDING_PAYMENT;
    case "processing":
      return OrderStatus.PROCESSING;
    case "on-hold":
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
  const { usersCsv, ordersCsv, apply } = args();

  if (!fs.existsSync(usersCsv)) {
    console.error(`Users CSV not found: ${usersCsv}`);
    process.exit(1);
  }
  if (!fs.existsSync(ordersCsv)) {
    console.error(`Orders CSV not found: ${ordersCsv}`);
    process.exit(1);
  }

  const userRows = readCsvRecords(usersCsv);
  const orderRows = readCsvRecords(ordersCsv);

  console.log(`Users CSV: ${usersCsv} (${userRows.length} rows)`);
  console.log(`Orders CSV: ${ordersCsv} (${orderRows.length} rows)`);
  console.log(`Mode: ${apply ? "APPLY (writes database)" : "DRY-RUN"}`);

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

  for (const row of userRows) {
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
  }

  console.log(`\nUsers: created=${usersCreated} touched=${usersUpdated} skipped/errors=${userErrors}`);

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

  for (const row of orderRows) {
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

      const billingEmail =
        lowerEmail(row.billing_email) ??
        lowerEmail(row.customer_email) ??
        lowerEmail(row.shipping_email);

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
