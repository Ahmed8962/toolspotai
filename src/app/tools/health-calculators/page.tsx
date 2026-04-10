import CategoryHubPage, {
  generateHubMetadata,
} from "@/components/marketing/CategoryHubPage";

export const metadata = generateHubMetadata("health");

export default function Page() {
  return <CategoryHubPage categoryId="health" />;
}
