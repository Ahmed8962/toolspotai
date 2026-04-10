import CategoryHubPage, {
  generateHubMetadata,
} from "@/components/marketing/CategoryHubPage";

export const metadata = generateHubMetadata("education");

export default function Page() {
  return <CategoryHubPage categoryId="education" />;
}
