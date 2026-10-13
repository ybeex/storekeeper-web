"use client";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { can, type Cap } from "@/lib/roles";

/** Renders children only for roles that hold the capability; otherwise a plain explanation. */
export function Restricted({ cap, children }: { cap: Cap; children: ReactNode }) {
  const { me } = useAuth();
  if (can(me?.role, cap)) return <>{children}</>;
  return <div className="glass card empty"><Lock size={26} /><strong>Your role cannot open this</strong><span>Ask an administrator if you need access.</span></div>;
}
export const useCan = (cap: Cap) => can(useAuth().me?.role, cap);
