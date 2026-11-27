/** Estado estándar que devuelven las Server Actions a los formularios. */
export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Valores enviados, para no perder lo escrito cuando hay errores. */
  values?: Record<string, string>;
  /** Solo en modo demostración sin proveedor de correo: enlace que normalmente llegaría por email. */
  devLink?: string;
  /** Marca de tiempo para que el cliente distinga envíos consecutivos. */
  at?: number;
}

export const idleState: ActionState = { status: "idle" };
