import type { CSSProperties } from "react";
import { Link, Text } from "react-email";

/** Renders admin “additional content” as plain paragraphs; lines starting with http(s) become links. */
export function AdditionalContentBlocks({
  text,
  accentColor,
  paragraphStyle,
}: {
  text: string;
  accentColor: string;
  paragraphStyle: CSSProperties;
}) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const blocks = trimmed.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const urlLine = lines.length === 1 && /^https?:\/\//i.test(lines[0]);
        if (urlLine) {
          return (
            <Text key={i} style={{ ...paragraphStyle, marginTop: i === 0 ? 16 : 12 }}>
              <Link href={lines[0]} style={{ color: accentColor, textDecoration: "underline" }}>
                {lines[0]}
              </Link>
            </Text>
          );
        }
        return (
          <Text key={i} style={{ ...paragraphStyle, marginTop: i === 0 ? 16 : 12, whiteSpace: "pre-line" }}>
            {block}
          </Text>
        );
      })}
    </>
  );
}
