"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import AdminAddCombosPage from "./AdminAddCombosPage";

export default function AdminAddComboPage() {
  const searchParams = useSearchParams();

  const duplicateData = useMemo(() => {
    const isDuplicate = searchParams.get("duplicate") === "true";
    const dataParam = searchParams.get("data");

    if (isDuplicate && dataParam) {
      try {
        return JSON.parse(dataParam);
      } catch {
        return null;
      }
    }
    return null;
  }, [searchParams]);

  return <AdminAddCombosPage editingCombo={duplicateData} isEditing={false} />;
}
