"use client";

import { useActionState, useEffect } from "react";
import type { ActionState } from "@/lib/action-state";
import { idleState } from "@/lib/action-state";
import { track } from "@/lib/analytics";

/** useActionState + evento de analítica cuando la acción termina con éxito. */
export function useTrackedAction(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  eventName?: string,
  props?: Record<string, string>,
) {
  const [state, formAction, pending] = useActionState(action, idleState);
  useEffect(() => {
    if (eventName && state.status === "success") track(eventName, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.at]);
  return [state, formAction, pending] as const;
}
