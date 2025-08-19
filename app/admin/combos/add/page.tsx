"use client";

import { Suspense } from "react";
import SearchParamsWrapper from "./SearchParamsWrapper";

export default function AdminAddComboPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper />
    </Suspense>
  );
}
