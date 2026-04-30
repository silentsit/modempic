"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export function AppProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      basePath="/api/auth"
      /** Avoids extra /api/auth/session calls on tab focus that often fail in multi-host dev (e.g. *.local vs localhost). */
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
