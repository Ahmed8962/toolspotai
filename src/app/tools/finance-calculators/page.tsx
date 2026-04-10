import CategoryHubPage, {
  generateHubMetadata,
} from "@/components/marketing/CategoryHubPage";

export const metadata = generateHubMetadata("finance");

export default function Page() {
  return <CategoryHubPage categoryId="finance" />;
}
