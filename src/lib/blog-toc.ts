/** Contentful / shared Rich Text shape (see RichTextRenderer) */
type RichNode = {
  nodeType: string;
  value?: string;
  marks?: Array<{ type: string }>;
  data?: { uri?: string };
  content?: RichNode[];
};

export type TocItem = { id: string; text: string; level: 2 | 3 };

function textFromNode(node: RichNode): string {
  if (node.nodeType === "text") return node.value ?? "";
  return (node.content ?? []).map(textFromNode).join("");
}

function slugifyId(text: string, used: Set<string>): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "section";
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function walk(nodes: RichNode[] | undefined, out: TocItem[], used: Set<string>) {
  for (const node of nodes ?? []) {
    if (node.nodeType === "heading-2" || node.nodeType === "heading-3") {
      const text = textFromNode(node).trim() || "Section";
      const level = node.nodeType === "heading-2" ? 2 : 3;
      const id = slugifyId(text, used);
      out.push({ id, text, level });
    }
    if (node.content?.length) {
      walk(node.content, out, used);
    }
  }
}

export function buildTocFromRichText(doc: { content?: RichNode[] } | null | undefined): TocItem[] {
  if (!doc?.content) return [];
  const out: TocItem[] = [];
  const used = new Set<string>();
  walk(doc.content, out, used);
  return out;
}
