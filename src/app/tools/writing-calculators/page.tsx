import CategoryHubPage, {
  generateHubMetadata,
} from "@/components/marketing/CategoryHubPage";

export const metadata = generateHubMetadata("writing");

export default function Page() {
  return <CategoryHubPage categoryId="writing" />;
}
