/* eslint-disable react/no-unescaped-entities */
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AdminAddCombosPage from "../../add/AdminAddCombosPage";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ComboItem {
  _id: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
}

interface SpecialCombo {
  _id: string;
  name: string;
  description: string;
  items: ComboItem[];
  totalPrice: number;
  imageUrl: string;
  available: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  metaDescription?: string;
}

export default function AdminEditComboPage() {
  const params = useParams();
  const router = useRouter();
  const comboId = params.id as string;

  const {
    data: combo,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SpecialCombo>({
    queryKey: ["combo", comboId],
    queryFn: async () => {
      const res = await fetch(`/api/special-combo/${comboId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Combo not found");
        }
        throw new Error(`Failed to fetch combo: ${res.status}`);
      }
      const data = await res.json();
      return data.data || data;
    },
    enabled: !!comboId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Combo
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch the combo details...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Combo
          </h2>
          <p className="text-gray-600 mb-6">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => refetch()}>Try Again</Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/combos")}
            >
              Back to Combos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Combo Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The combo you're looking for doesn't exist or may have been deleted.
          </p>
          <Button onClick={() => router.push("/admin/combos")}>
            Back to Combos
          </Button>
        </div>
      </div>
    );
  }

  return <AdminAddCombosPage editingCombo={combo} isEditing={true} />;
}
