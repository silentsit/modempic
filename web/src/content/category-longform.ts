/** Long-form HTML for each storefront category page. Catalog and ordering copy only. */

const NOOTROPICS_LONGFORM = `
<div class="max-w-3xl space-y-5 text-sm leading-7 text-muted-foreground">
  <h2 class="text-2xl font-semibold tracking-tight text-foreground">How this nootropics catalog is organized</h2>
  <p>
    The nootropics category on Modempic is the live list of Modafinil and Armodafinil pack listings. Each card is a product you can open, pick a pack size on, and take to checkout. USD totals stay on the product page so they match the cart.
  </p>
  <p>
    Most listings use 30, 50, and 100 pill packs. The 50- and 100-count rows show a per-pill save against the 30-pack when that pack is actually cheaper. Combos, when present, use their own pack labels instead of that 30/50/100 grid.
  </p>
  <h3 class="text-lg font-semibold text-foreground">What to compare before you add a pack</h3>
  <ul class="list-disc space-y-2 pl-5">
    <li>Brand name and tablet strength printed on the listing.</li>
    <li>Pack size and the live USD total for that size.</li>
    <li>Manufacturer, when the product page has a verified label manufacturer.</li>
    <li>Approved customer reviews on that product, not a generic rating for the molecule.</li>
  </ul>
  <p>
    For a single table of every live pack, use the <a class="text-accent underline-offset-2 hover:underline" href="/modafinil-price-comparison">Modafinil price comparison</a>. Brand-versus-brand pages use <code>/compare/…</code> URLs and only publish when both listings have manufacturer data, two price tiers, and enough reviews.
  </p>
  <p>
    These category pages are catalog and ordering pages. They are not medical, dosage, or personal-use guidance. Shipping timelines and customs notes live on <a class="text-accent underline-offset-2 hover:underline" href="/shipping">Shipping</a>.
  </p>
</div>
`.trim();

const ANTI_EPILEPTIC_LONGFORM = `
<div class="max-w-3xl space-y-5 text-sm leading-7 text-muted-foreground">
  <h2 class="text-2xl font-semibold tracking-tight text-foreground">Anti-epileptic listings on Modempic</h2>
  <p>
    The anti-epileptic category is reserved for catalog records in that storefront group. When a listing is published here, the product page shows the label name, pack options, USD price, and any shipping notes attached to that SKU.
  </p>
  <p>
    If the grid above is empty, nothing in this group is published for sale yet. Use <a class="text-accent underline-offset-2 hover:underline" href="/shop">Shop</a> for live inventory, or <a class="text-accent underline-offset-2 hover:underline" href="/contact">contact</a> if you need a status on a specific label.
  </p>
  <p>
    Category and product pages are catalog and ordering information only. They are not diagnosis, treatment, or dosage guidance.
  </p>
</div>
`.trim();

const SKINCARE_LONGFORM = `
<div class="max-w-3xl space-y-5 text-sm leading-7 text-muted-foreground">
  <h2 class="text-2xl font-semibold tracking-tight text-foreground">Skincare listings on Modempic</h2>
  <p>
    The skincare category is the storefront slot for published skin-care catalog records. A live card means you can open the product, read the pack and price, and check out with the same USD total shown on that page.
  </p>
  <p>
    If no products appear above, this group has no published SKUs right now. Browse <a class="text-accent underline-offset-2 hover:underline" href="/shop">the full shop</a> for what is in stock.
  </p>
  <p>
    These pages describe catalog items and checkout. They are not a substitute for a clinician or a labeled patient leaflet.
  </p>
</div>
`.trim();

const SEXUAL_HEALTH_LONGFORM = `
<div class="max-w-3xl space-y-5 text-sm leading-7 text-muted-foreground">
  <h2 class="text-2xl font-semibold tracking-tight text-foreground">Sexual health listings on Modempic</h2>
  <p>
    The sexual health category holds published catalog records in that group. Each product page is the source of truth for pack size, USD price, and any shipping restriction written on that listing.
  </p>
  <p>
    An empty grid means no SKU in this group is published. Use <a class="text-accent underline-offset-2 hover:underline" href="/shop">Shop</a> to see current inventory.
  </p>
  <p>
    Modempic category pages are catalog and ordering pages. They are not medical advice and do not replace the product label.
  </p>
</div>
`.trim();

export const CATEGORY_LONGFORM_HTML: Record<string, string> = {
  nootropics: NOOTROPICS_LONGFORM,
  "anti-epileptic": ANTI_EPILEPTIC_LONGFORM,
  skincare: SKINCARE_LONGFORM,
  "sexual-health": SEXUAL_HEALTH_LONGFORM,
};

export function categoryLongformHtml(slug: string): string {
  return CATEGORY_LONGFORM_HTML[slug] ?? "";
}
