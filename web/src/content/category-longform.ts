/** Long-form HTML for each storefront category page. Empty until editorial copy is added. */
export const CATEGORY_LONGFORM_HTML: Record<string, string> = {
  nootropics: "",
  "anti-epileptic": "",
  skincare: "",
  "sexual-health": "",
};

export function categoryLongformHtml(slug: string): string {
  return CATEGORY_LONGFORM_HTML[slug] ?? "";
}
