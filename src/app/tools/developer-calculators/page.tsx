import CategoryHubPage, {
  generateHubMetadata,
} from "@/components/marketing/CategoryHubPage";

export const metadata = generateHubMetadata("developer");

export default function Page() {
  return <CategoryHubPage categoryId="developer" />;
}
