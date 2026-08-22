import { useEffect } from "react";
import { useStudio } from "@/lib/store";

export function HydrateStudio({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsub = useStudio.persist.onFinishHydration(() => {
      useStudio.getState().setHydrated(true);
    });
    void useStudio.persist.rehydrate();
    if (useStudio.persist.hasHydrated()) {
      useStudio.getState().setHydrated(true);
    }
    return unsub;
  }, []);
  return <>{children}</>;
}
