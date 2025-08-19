/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Settings,
  Copy,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  viewCount?: number;
  orderCount?: number;
  tags?: string[];
  allergens?: string[];
  slug?: string;
}

interface ApiResponse {
  success: boolean;
  data: SpecialCombo[];
  meta?: {
    total: number;
    count: number;
    skip: number;
    limit: number;
    hasMore: boolean;
  };
  message: string;
}

interface Stats {
  total: number;
  available: number;
  featured: number;
  totalRevenue: number;
  avgPrice: number;
  popularCombo?: SpecialCombo;
}

export default function AdminManageCombosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCombos, setSelectedCombos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<SpecialCombo | null>(null);
  const [bulkAction, setBulkAction] = useState("");

  // Fetch special combos with advanced filtering
  const {
    data: combosResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ApiResponse>({
    queryKey: ["adminSpecialCombos", filterStatus, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        available:
          filterStatus === "available"
            ? "true"
            : filterStatus === "unavailable"
            ? "false"
            : "all",
        featured: filterStatus === "featured" ? "true" : "all",
        limit: "50",
        skip: "0",
      });

      const res = await fetch(`/api/special-combo?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch combos: ${res.status}`);
      }
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const combos = combosResponse?.data || [];

  // Calculate statistics
  const stats: Stats = useMemo(() => {
    const total = combos.length;
    const available = combos.filter((combo) => combo.available).length;
    const featured = combos.filter((combo) => combo.featured).length;
    const totalRevenue = combos.reduce(
      (sum, combo) => sum + combo.totalPrice * (combo.orderCount || 0),
      0
    );
    const avgPrice =
      total > 0
        ? combos.reduce((sum, combo) => sum + combo.totalPrice, 0) / total
        : 0;
    const popularCombo = combos.sort(
      (a, b) => (b.orderCount || 0) - (a.orderCount || 0)
    )[0];

    return { total, available, featured, totalRevenue, avgPrice, popularCombo };
  }, [combos]);

  // Filter and search combos
  const filteredCombos = useMemo(() => {
    let filtered = combos;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (combo) =>
          combo.name.toLowerCase().includes(term) ||
          combo.description.toLowerCase().includes(term) ||
          combo.items.some((item) => item.name.toLowerCase().includes(term)) ||
          combo.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.totalPrice;
          bValue = b.totalPrice;
          break;
        case "popularity":
          aValue = (a.orderCount || 0) + (a.viewCount || 0);
          bValue = (b.orderCount || 0) + (b.viewCount || 0);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [combos, searchTerm, sortBy, sortOrder]);

  // Delete combo mutation
  const deleteComboMutation = useMutation({
    mutationFn: async (comboId: string) => {
      const res = await fetch(`/api/special-combo?id=${comboId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete combo");
      }

      return res.json();
    },
    onSuccess: (_, comboId) => {
      toast.success("Combo deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminSpecialCombos"] });
      setDeleteDialogOpen(false);
      setComboToDelete(null);
      setSelectedCombos((prev) => prev.filter((id) => id !== comboId));
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete combo");
    },
  });

  // Bulk update mutation (toggle availability/featured status)
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      action,
      comboIds,
    }: {
      action: string;
      comboIds: string[];
    }) => {
      const promises = comboIds.map(async (id) => {
        const combo = combos.find((c) => c._id === id);
        if (!combo) return;

        let updateData = {};
        switch (action) {
          case "make-available":
            updateData = { available: true };
            break;
          case "make-unavailable":
            updateData = { available: false, featured: false };
            break;
          case "make-featured":
            updateData = { featured: true, available: true };
            break;
          case "remove-featured":
            updateData = { featured: false };
            break;
          default:
            return;
        }

        const res = await fetch(`/api/special-combo?id=${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) {
          throw new Error(`Failed to update combo ${combo.name}`);
        }

        return res.json();
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Combos updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminSpecialCombos"] });
      setSelectedCombos([]);
      setBulkAction("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update combos");
    },
  });

  // Quick toggle mutations
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({
      id,
      available,
    }: {
      id: string;
      available: boolean;
    }) => {
      const res = await fetch(`/api/special-combo?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          available,
          ...(available === false && { featured: false }),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update availability");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSpecialCombos"] });
      toast.success("Availability updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update availability");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const res = await fetch(`/api/special-combo?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featured,
          ...(featured === true && { available: true }),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update featured status");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSpecialCombos"] });
      toast.success("Featured status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update featured status");
    },
  });

  // Helper functions
  const handleSelectCombo = useCallback((comboId: string) => {
    setSelectedCombos((prev) =>
      prev.includes(comboId)
        ? prev.filter((id) => id !== comboId)
        : [...prev, comboId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedCombos.length === filteredCombos.length) {
      setSelectedCombos([]);
    } else {
      setSelectedCombos(filteredCombos.map((combo) => combo._id));
    }
  }, [selectedCombos.length, filteredCombos]);

  const handleBulkAction = useCallback(() => {
    if (bulkAction && selectedCombos.length > 0) {
      bulkUpdateMutation.mutate({
        action: bulkAction,
        comboIds: selectedCombos,
      });
    }
  }, [bulkAction, selectedCombos, bulkUpdateMutation]);

  const handleDeleteCombo = useCallback((combo: SpecialCombo) => {
    setComboToDelete(combo);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (comboToDelete) {
      deleteComboMutation.mutate(comboToDelete._id);
    }
  }, [comboToDelete, deleteComboMutation]);

  const duplicateCombo = useCallback(
    (combo: SpecialCombo) => {
      const duplicatedCombo = {
        ...combo,
        name: `${combo.name} (Copy)`,
        featured: false,
      };

      // Navigate to add page with pre-filled data
      const searchParams = new URLSearchParams({
        duplicate: "true",
        data: JSON.stringify(duplicatedCombo),
      });

      router.push(`/admin/combos/add?${searchParams}`);
    },
    [router]
  );

  // Render components
  const ComboCard = ({ combo }: { combo: SpecialCombo }) => (
    <Card
      className={`relative transition-all duration-200 ${
        selectedCombos.includes(combo._id) ? "ring-2 ring-blue-500" : ""
      } hover:shadow-lg`}
    >
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={selectedCombos.includes(combo._id)}
          onChange={() => handleSelectCombo(combo._id)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>

      <div className="relative">
        <Image
          src={combo.imageUrl}
          alt={combo.name}
          width={400}
          height={200}
          className="w-full h-32 object-cover rounded-t-lg"
        />

        <div className="absolute top-2 right-2 flex gap-1">
          {combo.featured && (
            <Badge className="bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {!combo.available && (
            <Badge variant="secondary">
              <EyeOff className="w-3 h-3 mr-1" />
              Hidden
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{combo.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/combos/edit/${combo._id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateCombo(combo)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  toggleAvailabilityMutation.mutate({
                    id: combo._id,
                    available: !combo.available,
                  })
                }
              >
                {combo.available ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Make Unavailable
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Make Available
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toggleFeaturedMutation.mutate({
                    id: combo._id,
                    featured: !combo.featured,
                  })
                }
              >
                {combo.featured ? (
                  <>
                    <StarOff className="w-4 h-4 mr-2" />
                    Remove from Featured
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Make Featured
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteCombo(combo)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {combo.description}
        </p>

        <div className="space-y-2 mb-3">
          <div className="text-sm">
            <span className="font-medium text-green-600">
              ₦{combo.totalPrice.toLocaleString()}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            {combo.items.length} item{combo.items.length !== 1 ? "s" : ""} •
            {combo.viewCount || 0} views •{combo.orderCount || 0} orders
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => router.push(`/admin/combos/edit/${combo._id}`)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toggleAvailabilityMutation.mutate({
                  id: combo._id,
                  available: !combo.available,
                })
              }
            >
              {combo.available ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toggleFeaturedMutation.mutate({
                  id: combo._id,
                  featured: !combo.featured,
                })
              }
            >
              {combo.featured ? (
                <StarOff className="w-4 h-4" />
              ) : (
                <Star className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ComboTableRow = ({ combo }: { combo: SpecialCombo }) => (
    <TableRow
      className={selectedCombos.includes(combo._id) ? "bg-blue-50" : ""}
    >
      <TableCell>
        <input
          type="checkbox"
          checked={selectedCombos.includes(combo._id)}
          onChange={() => handleSelectCombo(combo._id)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Image
            src={combo.imageUrl}
            alt={combo.name}
            width={50}
            height={50}
            className="rounded object-cover"
          />
          <div>
            <div className="font-medium">{combo.name}</div>
            <div className="text-sm text-gray-500 line-clamp-1">
              {combo.description}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium text-green-600">
          ₦{combo.totalPrice.toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {combo.items.length} item{combo.items.length !== 1 ? "s" : ""}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {combo.available ? (
            <Badge
              variant="outline"
              className="text-green-600 border-green-600"
            >
              <Eye className="w-3 h-3 mr-1" />
              Available
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              <EyeOff className="w-3 h-3 mr-1" />
              Hidden
            </Badge>
          )}
          {combo.featured && (
            <Badge className="bg-yellow-500">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-600">
          {combo.viewCount || 0} views
          <br />
          {combo.orderCount || 0} orders
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-500">
          {new Date(combo.updatedAt).toLocaleDateString()}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/admin/combos/edit/${combo._id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateCombo(combo)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toggleAvailabilityMutation.mutate({
                  id: combo._id,
                  available: !combo.available,
                })
              }
            >
              {combo.available ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Make Unavailable
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Make Available
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleFeaturedMutation.mutate({
                  id: combo._id,
                  featured: !combo.featured,
                })
              }
            >
              {combo.featured ? (
                <>
                  <StarOff className="w-4 h-4 mr-2" />
                  Remove from Featured
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Make Featured
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteCombo(combo)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="w-full h-32" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Special Combos
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your restaurant's special combo offers
              </p>
            </div>
            <Button onClick={() => router.push("/admin/combos/add")}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Combo
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Combos
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Available
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.available}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Featured
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.featured}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avg. Price
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦
                      {stats.avgPrice.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Alert */}
          {isError && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>Failed to load combos: {error?.message}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search combos by name, description, or items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Combos</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="updatedAt">Last Updated</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "table" : "grid")
                  }
                >
                  {viewMode === "grid" ? "Table" : "Grid"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCombos.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedCombos.length} combo
                      {selectedCombos.length !== 1 ? "s" : ""} selected
                    </span>

                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose bulk action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="make-available">
                          Make Available
                        </SelectItem>
                        <SelectItem value="make-unavailable">
                          Make Unavailable
                        </SelectItem>
                        <SelectItem value="make-featured">
                          Make Featured
                        </SelectItem>
                        <SelectItem value="remove-featured">
                          Remove Featured
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || bulkUpdateMutation.isPending}
                      size="sm"
                    >
                      {bulkUpdateMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Apply
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCombos([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {filteredCombos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "No combos found"
                  : "No combos yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first special combo to get started"}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button onClick={() => router.push("/admin/combos/add")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Combo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredCombos.length} of {combos.length} combos
                </p>
                {selectedCombos.length < filteredCombos.length && (
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                )}
                {selectedCombos.length === filteredCombos.length &&
                  filteredCombos.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                      Deselect All
                    </Button>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCombos.map((combo) => (
                <ComboCard key={combo._id} combo={combo} />
              ))}
            </div>
          </>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedCombos.length === filteredCombos.length &&
                          filteredCombos.length > 0
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Combo</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombos.map((combo) => (
                    <ComboTableRow key={combo._id} combo={combo} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Combo</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{comboToDelete?.name}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteComboMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteComboMutation.isPending}
              >
                {deleteComboMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Combo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
