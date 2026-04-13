import { CATEGORY_HUBS } from "@/data/category-hubs";
import { categories, tools, getToolsByCategory } from "@/data/tools";
import NavbarClient, { type NavCategory } from "@/components/layout/NavbarClient";

export default function Navbar() {
  const navCategories: NavCategory[] = categories.map((cat) => {
    const catTools = getToolsByCategory(cat.id);
    return {
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
      hubPath: CATEGORY_HUBS[cat.id].path,
      tools: catTools.map((t) => ({
        slug: t.slug,
        shortTitle: t.shortTitle,
        icon: t.icon,
      })),
    };
  });

  return <NavbarClient navCategories={navCategories} toolCount={tools.length} />;
}
