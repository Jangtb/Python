import { SubNav } from "@/components/layout/SubNav";

export default function ConsultingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="consultoria">
      <SubNav brand="consultoria" />
      {children}
    </div>
  );
}
