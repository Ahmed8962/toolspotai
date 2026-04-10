import CategoryHubPage, {
  generateHubMetadata,
} from "@/components/marketing/CategoryHubPage";

export const metadata = generateHubMetadata("daily");

export default function Page() {
  return <CategoryHubPage categoryId="daily" />;
}
