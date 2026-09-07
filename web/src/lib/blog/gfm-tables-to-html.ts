/**
 * Convert GFM pipe tables to HTML so next-mdx-remote can render them.
 * MDX without remark-gfm treats `| col | col |` as a paragraph.
 */

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineToHtml(cell: string): string {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  const parts: string[] = [];
  let last = 0;
  for (const match of cell.matchAll(re)) {
    const index = match.index ?? 0;
    parts.push(escapeHtml(cell.slice(last, index)));
    parts.push(`<a href="${escapeHtml(match[2])}">${escapeHtml(match[1])}</a>`);
    last = index + match[0].length;
  }
  parts.push(escapeHtml(cell.slice(last)));
  return parts.join("").trim();
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isPipeRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.includes("|", 1);
}

function isSeparatorRow(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function renderCell(tag: "th" | "td", value: string): string {
  return `<${tag}>${inlineToHtml(value)}</${tag}>`;
}

function renderRow(tag: "th" | "td", cells: string[]): string {
  return `<tr>\n${cells.map((cell) => renderCell(tag, cell)).join("\n")}\n</tr>`;
}

function tableToHtml(header: string[], rows: string[][]): string {
  return [
    '<div class="blog-table-scroll" role="region" aria-label="Scrollable table" tabindex="0">',
    "<table>",
    "<thead>",
    renderRow("th", header),
    "</thead>",
    "<tbody>",
    ...rows.map((row) => renderRow("td", row)),
    "</tbody>",
    "</table>",
    "</div>",
  ].join("\n");
}

/** Replace GFM pipe tables with HTML tables. Leaves existing HTML tables alone. */
export function gfmTablesToHtml(mdx: string): string {
  const lines = mdx.split(/\r?\n/);
  const out: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const headerLine = lines[i];
    const separatorLine = lines[i + 1];
    if (isPipeRow(headerLine) && separatorLine != null && isSeparatorRow(separatorLine)) {
      const header = splitRow(headerLine);
      const body: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isPipeRow(lines[j]) && !isSeparatorRow(lines[j])) {
        body.push(splitRow(lines[j]));
        j += 1;
      }
      out.push(tableToHtml(header, body));
      i = j - 1;
      continue;
    }
    out.push(headerLine);
  }

  return out.join("\n");
}
