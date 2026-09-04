/** Empty `?query=` / `?cat=` must stay indexable — only real filter values are noindex. */
export function hasMeaningfulSearchParam(value: string | null | undefined) {
  return Boolean(value?.trim());
}
