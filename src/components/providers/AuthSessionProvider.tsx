"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export const AuthSessionProvider: React.FC<{
  session: Session | null;
  children: React.ReactNode;
}> = ({ session, children }) => {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
};
