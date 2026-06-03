import { Suspense } from "react";
import HospitalsClient from "./hospitals-client";

export default function HospitalsPage() {
  return (
    <Suspense fallback={null}>
      <HospitalsClient />
    </Suspense>
  );
}
