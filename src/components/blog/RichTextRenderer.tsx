import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type RichNode = {
  nodeType: string;
  value?: string;
  marks?: Array<{ type: string }>;
  data?: { uri?: string };
  content?: RichNode[];
};

type RichDocument = {
  nodeType: string;
  content: RichNode[];
};

function applyMarks(
  value: string,
  marks: Array<{ type: string }> = [],
): ReactNode {
  return marks.reduce<ReactNode>((acc, mark, index) => {
    if (mark.type === "bold") return <strong key={index}>{acc}</strong>;
    if (mark.type === "italic") return <em key={index}>{acc}</em>;
    if (mark.type === "underline") return <u key={index}>{acc}</u>;
    if (mark.type === "code") {
      return (
        <code
          key={index}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800"
        >
          {acc}
        </code>
      );
    }
    return acc;
  }, value);
}

function nextHeadingId(headingIdQueue: string[] | undefined, counter: { n: number }): string | undefined {
  if (!headingIdQueue || counter.n >= headingIdQueue.length) return undefined;
  return headingIdQueue[counter.n++];
}

function renderNode(
  node: RichNode,
  key: string,
  headingIdQueue: string[] | undefined,
  counter: { n: number },
): ReactNode {
  if (node.nodeType === "text") {
    return (
      <Fragment key={key}>
        {applyMarks(node.value ?? "", node.marks)}
      </Fragment>
    );
  }

  const children = (node.content ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`, headingIdQueue, counter),
  );

  switch (node.nodeType) {
    case "paragraph":
      return (
        <p
          key={key}
          className="mt-3 text-[1.02rem] leading-7 text-slate-700 first:mt-0"
        >
          {children}
        </p>
      );
    case "heading-2": {
      const id = nextHeadingId(headingIdQueue, counter);
      return (
        <h2
          key={key}
          id={id}
          className="scroll-mt-28 mt-8 text-2xl font-bold tracking-tight text-brand-700 first:mt-0 sm:text-[1.65rem]"
        >
          {children}
        </h2>
      );
    }
    case "heading-3": {
      const id = nextHeadingId(headingIdQueue, counter);
      return (
        <h3
          key={key}
          id={id}
          className="scroll-mt-28 mt-6 text-xl font-semibold tracking-tight text-blue-800 sm:text-2xl"
        >
          {children}
        </h3>
      );
    }
    case "unordered-list":
      return (
        <ul
          key={key}
          className="mt-3 list-disc space-y-1.5 pl-6 text-slate-700 [li]:marker:text-brand-600"
        >
          {children}
        </ul>
      );
    case "ordered-list":
      return (
        <ol
          key={key}
          className="mt-3 list-decimal space-y-1.5 pl-6 text-slate-700 [li]:marker:font-bold [li]:marker:text-brand-700"
        >
          {children}
        </ol>
      );
    case "list-item":
      return (
        <li
          key={key}
          className="leading-[1.55] text-[1.02rem] text-slate-700 [&>p]:mt-0 [&>p]:leading-[1.55] [&>p+_p]:mt-1.5"
        >
          {children}
        </li>
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="mt-8 rounded-r-xl border-l-4 border-brand-400 bg-brand-50/50 py-1 pl-5 pr-2 italic text-slate-800"
        >
          {children}
        </blockquote>
      );
    case "hr":
      return <hr key={key} className="my-10 border-0 border-t border-slate-200" />;
    case "hyperlink": {
      const href = node.data?.uri || "#";
      const isExternal = href.startsWith("http");
      if (isExternal) {
        return (
          <a
            key={key}
            href={href}
            className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-700"
            rel="noopener noreferrer"
            target="_blank"
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          key={key}
          href={href}
          className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-700"
        >
          {children}
        </Link>
      );
    }
    default:
      return <div key={key}>{children}</div>;
  }
}

export default function RichTextRenderer({
  document,
  headingIdQueue,
}: {
  document: RichDocument | null;
  /** Same order as `buildTocFromRichText` (ids for each h2/h3 in visit order) */
  headingIdQueue?: string[];
}) {
  if (!document?.content?.length) return null;
  const counter = { n: 0 };
  return (
    <div className="prose-headings:scroll-mt-24">
      {document.content.map((node, index) =>
        renderNode(node, `root-${index}`, headingIdQueue, counter),
      )}
    </div>
  );
}
