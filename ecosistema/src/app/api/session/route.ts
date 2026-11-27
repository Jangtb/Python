import { NextResponse } from "next/server";
import { getViewer } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Datos mínimos de la sesión para la interfaz (nunca expone correo ni identificadores internos). */
export async function GET() {
  const viewer = await getViewer();
  const body = viewer
    ? {
        user: {
          displayName: viewer.profile.displayName,
          handle: viewer.profile.handle,
          role: viewer.user.role,
          verified: Boolean(viewer.user.emailVerifiedAt),
        },
      }
    : { user: null };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
