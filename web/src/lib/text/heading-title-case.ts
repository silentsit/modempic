/** Articles and short connecting words stay lowercase unless first or last. */
const SMALL_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "nor",
  "for",
  "yet",
  "so",
  "of",
  "in",
  "on",
  "at",
  "to",
  "by",
  "with",
  "from",
  "as",
  "vs",
  "v",
  "versus",
]);

const UNIT_WORDS = new Set(["mg", "mcg", "ml", "kg", "g", "mm"]);

function splitPunctuation(token: string): { lead: string; core: string; trail: string } {
  const match = token.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/);
  if (!match) return { lead: "", core: token, trail: "" };
  return { lead: match[1], core: match[2], trail: match[3] };
}

function capitalizeWord(core: string): string {
  if (!core) return core;
  if (core.includes("-")) {
    return core
      .split("-")
      .map((part) => capitalizeWord(part))
      .join("-");
  }
  if (core.includes("'")) {
    const [head, ...rest] = core.split("'");
    return [capitalizeWord(head), ...rest.map((part) => part.toLowerCase())].join("'");
  }
  if (core.includes("’")) {
    const [head, ...rest] = core.split("’");
    return [capitalizeWord(head), ...rest.map((part) => part.toLowerCase())].join("’");
  }
  return core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
}

function shouldKeepOriginal(core: string): boolean {
  if (!core) return true;
  if (/^[A-Z0-9]{2,}$/.test(core)) return true;
  return /[A-Z]/.test(core.slice(1));
}

function titleCaseCore(core: string, forceCap: boolean): string {
  if (!core) return core;
  if (shouldKeepOriginal(core)) return core;

  const lower = core.toLowerCase();
  if (lower === "i") return "I";
  if (UNIT_WORDS.has(lower)) return lower;
  if (!forceCap && SMALL_WORDS.has(lower)) return lower;
  return capitalizeWord(core);
}

/**
 * Title-case a heading: capitalize words except articles and short connectors.
 * First and last words are always capitalized (except units like mg).
 */
export function titleCaseHeading(text: string): string {
  const parts = text.split(/(\s+)/);
  const wordIndexes = parts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => !/^\s*$/.test(part) && splitPunctuation(part).core.length > 0);

  return parts
    .map((part, index) => {
      if (/^\s*$/.test(part)) return part;
      const { lead, core, trail } = splitPunctuation(part);
      if (!core) return part;
      const position = wordIndexes.findIndex((item) => item.index === index);
      const forceCap = position === 0 || position === wordIndexes.length - 1;
      return `${lead}${titleCaseCore(core, forceCap)}${trail}`;
    })
    .join("");
}

/** Title-case text nodes inside heading HTML only. */
export function titleCaseHeadingHtml(html: string): string {
  return html.replace(/<(h[1-6])(\b[^>]*)>([\s\S]*?)<\/\1>/gi, (_full, tag: string, attrs: string, inner: string) => {
    const texts: string[] = [];
    inner.replace(/(^|>)([^<]+)/g, (_m, _prefix: string, text: string) => {
      texts.push(text);
      return "";
    });
    const titled = titleCaseHeading(texts.join(""));
    let cursor = 0;
    const nextInner = inner.replace(/(^|>)([^<]+)/g, (_m, prefix: string, text: string) => {
      const slice = titled.slice(cursor, cursor + text.length);
      cursor += text.length;
      return prefix + slice;
    });
    return `<${tag}${attrs}>${nextInner}</${tag}>`;
  });
}
