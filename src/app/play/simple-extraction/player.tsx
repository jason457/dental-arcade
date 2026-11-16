"use client";
import { useEffect, useRef } from "react";

/** Mounts the framework-free game. The game owns everything inside this element. */
export function Player() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let unmount: (() => void) | undefined, cancelled = false;
    import("@/game/game").then((m) => { if (!cancelled && ref.current) unmount = m.mountExtraction(ref.current); });
    return () => { cancelled = true; unmount?.(); };
  }, []);
  return <div ref={ref}><p className="text-mute">Loading the operatory…</p></div>;
}
