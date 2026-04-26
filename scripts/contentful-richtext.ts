/**
 * Rich Text document helpers for Contentful CMA (matches RichTextRenderer node types).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function rText(value: string, marks: { type: string }[] = []): any {
  return { nodeType: "text", value, marks, data: {} };
}
export function rP(...parts: any[]): any {
  return { nodeType: "paragraph", data: {}, content: parts };
}
export function rH2(s: string): any {
  return { nodeType: "heading-2", data: {}, content: [rText(s)] };
}
export function rH3(s: string): any {
  return { nodeType: "heading-3", data: {}, content: [rText(s)] };
}
export function rBlockquote(...inner: any[]): any {
  return { nodeType: "blockquote", data: {}, content: inner };
}
export function rUl(...items: string[]): any {
  return {
    nodeType: "unordered-list",
    data: {},
    content: items.map((s) => ({
      nodeType: "list-item",
      data: {},
      content: [rP(rText(s))],
    })),
  };
}
export function rOl(...items: string[]): any {
  return {
    nodeType: "ordered-list",
    data: {},
    content: items.map((s) => ({
      nodeType: "list-item",
      data: {},
      content: [rP(rText(s))],
    })),
  };
}
export function rLink(href: string, label: string): any {
  return {
    nodeType: "hyperlink",
    data: { uri: href },
    content: [rText(label, [{ type: "bold" }])],
  };
}
/** Hyperlink with normal weight (in-body links). */
export function rA(href: string, label: string): any {
  return {
    nodeType: "hyperlink",
    data: { uri: href },
    content: [rText(label)],
  };
}
export function rHr(): any {
  return { nodeType: "hr", data: {}, content: [] };
}
export function rDoc(...content: any[]): any {
  return { nodeType: "document", data: {}, content };
}
