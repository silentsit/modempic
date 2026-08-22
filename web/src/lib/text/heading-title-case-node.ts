import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { titleCaseHeading } from "./heading-title-case";

function collectHeadingText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectHeadingText).join("");
  if (!isValidElement<{ children?: ReactNode }>(node)) return "";
  if (node.type === "code" || node.type === "pre") return "";
  return collectHeadingText(node.props.children);
}

function applyTitledText(node: ReactNode, titled: string, cursor: { i: number }): ReactNode {
  return Children.map(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      const raw = String(child);
      const slice = titled.slice(cursor.i, cursor.i + raw.length);
      cursor.i += raw.length;
      return slice;
    }
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    if (child.type === "code" || child.type === "pre") return child;
    if (child.props.children == null) return child;
    return cloneElement(child, undefined, applyTitledText(child.props.children, titled, cursor));
  });
}

export function titleCaseHeadingChildren(children: ReactNode): ReactNode {
  const titled = titleCaseHeading(collectHeadingText(children));
  return applyTitledText(children, titled, { i: 0 });
}
