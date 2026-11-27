import { SubNav } from "@/components/layout/SubNav";

export default function DcdLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="dcd">
      <SubNav brand="dcd" />
      {children}
    </div>
  );
}
