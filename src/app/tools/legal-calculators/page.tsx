import CategoryHubPage, {
  generateHubMetadata,
} from "@/components/marketing/CategoryHubPage";

export const metadata = generateHubMetadata("legal");

export default function Page() {
  return <CategoryHubPage categoryId="legal" />;
}
