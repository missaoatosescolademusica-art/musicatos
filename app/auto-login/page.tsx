import { Suspense } from "react";
import AutoLoginClient from "./AutoLoginClient";

export default function AutoLoginPage() {
  return (
    <Suspense fallback={null}>
      <AutoLoginClient />
    </Suspense>
  );
}
