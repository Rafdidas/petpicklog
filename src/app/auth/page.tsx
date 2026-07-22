import { Suspense } from "react";
import type { Metadata } from "next";
import AuthClient from "./auth-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthClient />
    </Suspense>
  );
}
