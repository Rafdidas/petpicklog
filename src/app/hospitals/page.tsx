import { Suspense } from "react";
import type { Metadata } from "next";
import HospitalsClient from "./hospitals-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/hospitals"
  }
};

export default function HospitalsPage() {
  return (
    <Suspense fallback={null}>
      <HospitalsClient />
    </Suspense>
  );
}
