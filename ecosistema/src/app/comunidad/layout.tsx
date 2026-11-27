import { SubNav } from "@/components/layout/SubNav";
import { DemoBanner } from "@/components/community/DemoBanner";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="comunidad">
      <SubNav brand="comunidad" />
      <DemoBanner />
      {children}
    </div>
  );
}
