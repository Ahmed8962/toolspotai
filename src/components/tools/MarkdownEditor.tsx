"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

type ViewMode = "split" | "editor" | "preview";

const STARTER = `# Markdown Editor

## Welcome to the Live Preview Editor

This editor supports **bold text**, *italic text*, and ~~strikethrough~~.

### Inline Formatting

You can use \`inline code\` for short snippets and **__bold italic__** for emphasis.

### Code Blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("World"));
\`\`\`

### Links & Images

[Visit ToolSpotAI](https://toolspotai.com)

![ToolSpotAI](/toolspotai-logo.svg)

### Lists

#### Unordered
- First item
- Second item
- Third item

#### Ordered
1. Step one
2. Step two
3. Step three

### Blockquote

> The best way to predict the future is to invent it.
> — Alan Kay

### Horizontal Rule

---

#### H4 Heading

That's all the syntax this editor supports. Start typing to see live changes!
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseInline(text: string): string {
  let out = text;

  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded my-2" />');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-600 underline hover:text-brand-700">$1</a>');
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-mono text-pink-600">$1</code>');
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__(.+?)__/g, "<strong>$1</strong>");
  out = out.replace(/~~(.+?)~~/g, "<del>$1</del>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  out = out.replace(/_(.+?)_/g, "<em>$1</em>");

  return out;
}

function parseMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++;
      html.push(
        `<pre class="my-3 overflow-auto rounded-lg bg-slate-900 p-4 text-sm leading-relaxed"><code class="text-green-400">${lang ? `<span class="mb-2 block text-xs text-slate-500">${escapeHtml(lang)}</span>` : ""}${codeLines.join("\n")}</code></pre>`,
      );
      continue;
    }

    if (/^---$|^\*\*\*$/.test(line.trim())) {
      html.push('<hr class="my-4 border-t border-border" />');
      i++;
      continue;
    }

    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const sizes = ["text-3xl font-bold", "text-2xl font-bold", "text-xl font-semibold", "text-lg font-semibold"];
      const margins = ["mt-6 mb-3", "mt-5 mb-2", "mt-4 mb-2", "mt-3 mb-1"];
      html.push(`<h${level} class="${sizes[level - 1]} ${margins[level - 1]} text-text-primary">${parseInline(escapeHtml(headerMatch[2]))}</h${level}>`);
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      html.push(
        `<blockquote class="my-3 border-l-4 border-brand-400 bg-brand-50 py-2 pl-4 pr-3 text-text-secondary italic rounded-r-lg">${quoteLines.map((l) => parseInline(escapeHtml(l))).join("<br/>")}</blockquote>`,
      );
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      html.push(
        `<ul class="my-2 ml-6 list-disc space-y-1 text-text-primary">${items.map((it) => `<li>${parseInline(escapeHtml(it))}</li>`).join("")}</ul>`,
      );
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      html.push(
        `<ol class="my-2 ml-6 list-decimal space-y-1 text-text-primary">${items.map((it) => `<li>${parseInline(escapeHtml(it))}</li>`).join("")}</ol>`,
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("> ") && !lines[i].startsWith("```") && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^---$|^\*\*\*$/.test(lines[i].trim())) {
      paraLines.push(lines[i]);
      i++;
    }
    html.push(`<p class="my-2 leading-relaxed text-text-primary">${paraLines.map((l) => parseInline(escapeHtml(l))).join("<br/>")}</p>`);
  }

  return html.join("\n");
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

const TOOLBAR: { label: string; icon: string; prefix: string; suffix: string; block?: boolean }[] = [
  { label: "Bold", icon: "B", prefix: "**", suffix: "**" },
  { label: "Italic", icon: "I", prefix: "*", suffix: "*" },
  { label: "H1", icon: "H1", prefix: "# ", suffix: "", block: true },
  { label: "H2", icon: "H2", prefix: "## ", suffix: "", block: true },
  { label: "H3", icon: "H3", prefix: "### ", suffix: "", block: true },
  { label: "Link", icon: "🔗", prefix: "[", suffix: "](url)" },
  { label: "Image", icon: "🖼", prefix: "![alt](", suffix: ")" },
  { label: "Code", icon: "</>", prefix: "`", suffix: "`" },
  { label: "List", icon: "•", prefix: "- ", suffix: "", block: true },
  { label: "Quote", icon: "❝", prefix: "> ", suffix: "", block: true },
  { label: "HR", icon: "—", prefix: "\n---\n", suffix: "" },
];

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(STARTER);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState<string | null>(null);

  const htmlOutput = useMemo(() => parseMarkdown(markdown), [markdown]);

  const stats = useMemo(() => {
    const chars = markdown.length;
    const words = markdown.trim() === "" ? 0 : markdown.trim().split(/\s+/).length;
    return { chars, words };
  }, [markdown]);

  const insertAtCursor = useCallback(
    (prefix: string, suffix: string, block?: boolean) => {
      const ta = document.getElementById("md-editor") as HTMLTextAreaElement | null;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = markdown.slice(start, end) || "text";
      const before = markdown.slice(0, start);
      const after = markdown.slice(end);

      let insertion: string;
      if (block && !suffix) {
        insertion = prefix + selected;
      } else {
        insertion = prefix + selected + suffix;
      }

      const next = before + insertion + after;
      setMarkdown(next);

      requestAnimationFrame(() => {
        ta.focus();
        const cursorPos = start + prefix.length + selected.length;
        ta.selectionStart = cursorPos;
        ta.selectionEnd = cursorPos;
      });
    },
    [markdown],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "b") {
          e.preventDefault();
          insertAtCursor("**", "**");
        } else if (e.key === "i") {
          e.preventDefault();
          insertAtCursor("*", "*");
        }
      }
    },
    [insertAtCursor],
  );

  const copyText = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  return (
    <div className="space-y-3">
      {/* Top bar: view modes + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
          {(
            [
              ["Split", "split"],
              ["Editor", "editor"],
              ["Preview", "preview"],
            ] as const
          ).map(([label, mode]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                viewMode === mode
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copyText(markdown, "md")}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-muted transition"
          >
            {copied === "md" ? "Copied!" : "Copy Markdown"}
          </button>
          <button
            type="button"
            onClick={() => copyText(htmlOutput, "html")}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-muted transition"
          >
            {copied === "html" ? "Copied!" : "Copy HTML"}
          </button>
          <button
            type="button"
            onClick={() => setMarkdown("")}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {viewMode !== "preview" && (
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-card p-2">
          {TOOLBAR.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              onClick={() => insertAtCursor(item.prefix, item.suffix, item.block)}
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition"
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}

      {/* Editor + Preview */}
      <div
        className={cn(
          "grid gap-4",
          viewMode === "split" && "grid-cols-1 md:grid-cols-2",
          viewMode === "editor" && "grid-cols-1",
          viewMode === "preview" && "grid-cols-1",
        )}
      >
        {viewMode !== "preview" && (
          <div className="flex flex-col">
            <label htmlFor="md-editor" className="mb-1 text-sm font-medium text-text-secondary">
              Markdown
            </label>
            <textarea
              id="md-editor"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              rows={22}
              className="flex-1 resize-y rounded-xl border border-border bg-surface-card p-4 font-mono text-sm leading-relaxed text-text-primary outline-none focus:ring-2 focus:ring-brand-500/30 min-h-[400px]"
              placeholder="Type your markdown here..."
            />
          </div>
        )}

        {viewMode !== "editor" && (
          <div className="flex flex-col">
            <span className="mb-1 text-sm font-medium text-text-secondary">Preview</span>
            <div
              className="flex-1 overflow-auto rounded-xl border border-border bg-white p-6 min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-card px-4 py-2 text-sm text-text-secondary">
        <div className="flex gap-4">
          <span>{stats.words} word{stats.words !== 1 && "s"}</span>
          <span>{stats.chars} character{stats.chars !== 1 && "s"}</span>
        </div>
        <span className="text-xs text-text-secondary/60">
          Ctrl+B bold · Ctrl+I italic
        </span>
      </div>
    </div>
  );
}
