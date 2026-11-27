import type { Metadata } from "next";
import { AdminNav } from "@/components/layout/AdminNav";
import { requireModeratorPage } from "@/server/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

/** Todo /admin exige rol de moderación o administración. Las acciones vuelven a validar el rol en el servidor. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireModeratorPage("/admin");
  return (
    <div className="container admin-layout">
      <div className="stack">
        <span className="eyebrow">{viewer.user.role === "admin" ? "Administración" : "Moderación"}</span>
        <AdminNav isAdmin={viewer.user.role === "admin"} />
      </div>
      <div className="stack stack--lg">{children}</div>
    </div>
  );
}
