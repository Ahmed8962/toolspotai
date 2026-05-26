import ToolsIndexPage from "@/components/marketing/ToolsIndexPage";
import { staticPageMetadata } from "@/lib/seo";
import { tools } from "@/data/tools";
import type { Metadata } from "next";

export const metadata: Metadata = staticPageMetadata("/tools", {
  title: { absolute: `All Free Online Tools (${tools.length}+) | ToolSpotAI` },
  description: `Browse ${tools.length}+ free online calculators and tools by category—finance, health, developer, writing, education, legal, and daily utilities. No signup required.`,
});

export default function ToolsPage() {
  return <ToolsIndexPage />;
}
