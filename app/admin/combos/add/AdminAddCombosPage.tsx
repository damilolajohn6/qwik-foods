/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CldUploadWidget } from "next-cloudinary";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Calculator,
  Eye,
  EyeOff,
  Star,
  StarOff,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ImageIcon,
  Upload,
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
import { Separator } from "@/components/ui/separator";

type ComboItem = {
  _id: string;
  quantity: number;
  name?: string;
  price?: number;
  category?: string;
  available?: boolean;
};

type MenuItem = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  available?: boolean;
  imageUrl?: string;
};

type SpecialCombo = {
  _id?: string;
  name: string;
  description: string;
  items: ComboItem[];
  totalPrice: number;
  imageUrl: string;
  available?: boolean;
  featured?: boolean;
  tags?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  metaDescription?: string;
};

const ALLERGENS = [
  "nuts",
  "dairy",
  "gluten",
  "eggs",
  "soy",
  "shellfish",
  "fish",
  "sesame",
];

interface AdminAddCombosPageProps {
  editingCombo?: SpecialCombo;
  isEditing?: boolean;
}

export default function AdminAddCombosPage({
  editingCombo,
  isEditing = false,
}: AdminAddCombosPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState(editingCombo?.name || "");
  const [description, setDescription] = useState(
    editingCombo?.description || ""
  );
  const [items, setItems] = useState<ComboItem[]>(
    editingCombo?.items?.length
      ? editingCombo.items
      : [{ _id: "", quantity: 1 }]
  );
  const [totalPrice, setTotalPrice] = useState(
    editingCombo?.totalPrice?.toString() || ""
  );
  const [imageUrl, setImageUrl] = useState(editingCombo?.imageUrl || "");
  const [available, setAvailable] = useState(editingCombo?.available ?? true);
  const [featured, setFeatured] = useState(editingCombo?.featured ?? false);
  const [tags, setTags] = useState<string[]>(editingCombo?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [allergens, setAllergens] = useState<string[]>(
    editingCombo?.allergens || []
  );
  const [nutritionalInfo, setNutritionalInfo] = useState(
    editingCombo?.nutritionalInfo || {
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
    }
  );
  const [metaDescription, setMetaDescription] = useState(
    editingCombo?.metaDescription || ""
  );

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useCalculatedPrice, setUseCalculatedPrice] = useState(true);

  const {
    data: menuItemsResponse,
    isLoading: isLoadingMenuItems,
    isError: isErrorMenuItems,
    error: menuItemsError,
    refetch: refetchMenuItems,
  } = useQuery({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${res.status}: ${res.statusText}`
        );
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const menuItems: MenuItem[] = useMemo(() => {
    return Array.isArray(menuItemsResponse?.data)
      ? menuItemsResponse.data.filter(
          (item: MenuItem) => item.available !== false
        )
      : [];
  }, [menuItemsResponse]);

  const calculatedTotalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const menuItem = menuItems.find((m) => m._id === item._id);
      return sum + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0);
  }, [items, menuItems]);

  const potentialSavings = useMemo(() => {
    const manualPrice = parseFloat(totalPrice) || 0;
    return calculatedTotalPrice - manualPrice;
  }, [calculatedTotalPrice, totalPrice]);

  useEffect(() => {
    if (useCalculatedPrice && calculatedTotalPrice > 0) {
      setTotalPrice(calculatedTotalPrice.toFixed(2));
    }
  }, [calculatedTotalPrice, useCalculatedPrice]);

  useEffect(() => {
    if (description && !metaDescription) {
      const generated =
        description.length > 160
          ? description.substring(0, 157) + "..."
          : description;
      setMetaDescription(generated);
    }
  }, [description, metaDescription]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Combo name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    const validItems = items.filter((item) => item._id && item.quantity > 0);
    if (validItems.length === 0) {
      newErrors.items = "At least one valid menu item is required";
    } else if (items.some((item) => item._id && item.quantity < 1)) {
      newErrors.items = "All quantities must be at least 1";
    } else if (items.some((item) => item._id && item.quantity > 99)) {
      newErrors.items = "Quantity cannot exceed 99";
    }

    const itemIds = validItems.map((item) => item._id);
    if (itemIds.length !== new Set(itemIds).size) {
      newErrors.items = "Duplicate items are not allowed";
    }

    const priceNum = parseFloat(totalPrice);
    if (!totalPrice || isNaN(priceNum)) {
      newErrors.totalPrice = "Valid total price is required";
    } else if (priceNum < 0) {
      newErrors.totalPrice = "Price cannot be negative";
    } else if (priceNum > 1000000) {
      newErrors.totalPrice = "Price cannot exceed ₦1,000,000";
    }

    // Image validation
    if (!imageUrl) {
      newErrors.imageUrl = "Combo image is required";
    } else {
      try {
        new URL(imageUrl);
        if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl.split("?")[0])) {
          newErrors.imageUrl =
            "Image must be a valid image file (jpg, jpeg, png, gif, webp)";
        }
      } catch {
        newErrors.imageUrl = "Invalid image URL";
      }
    }

    if (metaDescription && metaDescription.length > 160) {
      newErrors.metaDescription =
        "Meta description cannot exceed 160 characters";
    }

    if (
      nutritionalInfo.calories &&
      (nutritionalInfo.calories < 0 || nutritionalInfo.calories > 10000)
    ) {
      newErrors.nutritionalInfo = "Calories must be between 0 and 10,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    name,
    description,
    items,
    totalPrice,
    imageUrl,
    metaDescription,
    nutritionalInfo,
  ]);

  const saveComboMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error("Please fix the form errors before submitting");
      }

      const comboData = {
        name: name.trim(),
        description: description.trim(),
        items: items
          .filter((item) => item._id && item.quantity > 0)
          .map((item) => ({
            _id: item._id,
            quantity: item.quantity,
          })),
        totalPrice: parseFloat(totalPrice),
        imageUrl,
        available,
        featured,
        ...(tags.length > 0 && { tags }),
        ...(allergens.length > 0 && { allergens }),
        ...(Object.values(nutritionalInfo).some(
          (v) => v !== undefined && v !== null
        ) && {
          nutritionalInfo: {
            ...(nutritionalInfo.calories !== undefined &&
              nutritionalInfo.calories !== null && {
                calories: Number(nutritionalInfo.calories),
              }),
            ...(nutritionalInfo.protein !== undefined &&
              nutritionalInfo.protein !== null && {
                protein: Number(nutritionalInfo.protein),
              }),
            ...(nutritionalInfo.carbs !== undefined &&
              nutritionalInfo.carbs !== null && {
                carbs: Number(nutritionalInfo.carbs),
              }),
            ...(nutritionalInfo.fat !== undefined &&
              nutritionalInfo.fat !== null && {
                fat: Number(nutritionalInfo.fat),
              }),
          },
        }),
        ...(metaDescription && { metaDescription }),
      };

      const url =
        isEditing && editingCombo?._id
          ? `/api/special-combo?id=${editingCombo._id}`
          : "/api/special-combo";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comboData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `Failed to ${isEditing ? "update" : "add"} combo`
        );
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Combo ${isEditing ? "updated" : "added"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["specialCombos"] });
      queryClient.invalidateQueries({ queryKey: ["adminSpecialCombos"] });
      router.push("/admin/combos");
    },
    onError: (error: any) => {
      console.error("Save combo error:", error);
      toast.error(
        error.message || `Failed to ${isEditing ? "update" : "add"} combo`
      );
    },
  });

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { _id: "", quantity: 1 }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof ComboItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const toggleAllergen = useCallback((allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  }, []);

  // Image upload handling
  const handleImageUpload = useCallback((result: any) => {
    if (result?.event === "success") {
      setImageUrl(result.info.secure_url);
      setIsUploadingImage(false);
      toast.success("Image uploaded successfully!");
    }
  }, []);

  const getSelectedItemDetails = useCallback(
    (itemId: string): MenuItem | undefined => {
      return menuItems.find((item) => item._id === itemId);
    },
    [menuItems]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Combos
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? "Edit Special Combo" : "Add Special Combo"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing
              ? "Update your special combo details below"
              : "Create a new special combo by combining menu items"}
          </p>
        </div>

        {isErrorMenuItems && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load menu items: {menuItemsError?.message}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMenuItems()}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential details about your special combo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Combo Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Mega Crunch Combo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                    maxLength={100}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.name && (
                      <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {name.length}/100
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what makes this combo special..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={errors.description ? "border-red-500" : ""}
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && (
                      <p className="text-red-500 text-sm">
                        {errors.description}
                      </p>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {description.length}/500
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={available}
                      onCheckedChange={setAvailable}
                    />
                    <Label
                      htmlFor="available"
                      className="flex items-center gap-2"
                    >
                      {available ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      Available
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={featured}
                      onCheckedChange={setFeatured}
                      disabled={!available}
                    />
                    <Label
                      htmlFor="featured"
                      className="flex items-center gap-2"
                    >
                      {featured ? (
                        <Star className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                      )}
                      Featured
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Combo Items *</CardTitle>
                <CardDescription>
                  Select menu items and quantities for this combo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMenuItems ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading menu items...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const selectedItem = getSelectedItemDetails(item._id);
                      return (
                        <div
                          key={index}
                          className="flex gap-2 items-start p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <Select
                              value={item._id}
                              onValueChange={(value) =>
                                updateItem(index, "_id", value)
                              }
                            >
                              <SelectTrigger
                                className={errors.items ? "border-red-500" : ""}
                              >
                                <SelectValue placeholder="Select Menu Item" />
                              </SelectTrigger>
                              <SelectContent>
                                {menuItems.length === 0 ? (
                                  <SelectItem value="empty" disabled>
                                    No menu items available
                                  </SelectItem>
                                ) : (
                                  menuItems.map((menuItem) => (
                                    <SelectItem
                                      key={menuItem._id}
                                      value={menuItem._id}
                                    >
                                      <div className="flex justify-between w-full">
                                        <span>{menuItem.name}</span>
                                        <span className="text-green-600 font-medium ml-4">
                                          ₦{menuItem.price.toLocaleString()}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>

                            {selectedItem && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">
                                  ₦{selectedItem.price.toLocaleString()}
                                </span>
                                {selectedItem.category && (
                                  <Badge variant="outline" className="ml-2">
                                    {selectedItem.category}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="w-24">
                            <Label className="text-xs text-gray-500">Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              min="1"
                              max="99"
                              className="text-center"
                            />
                          </div>

                          <div className="w-24 text-right">
                            <Label className="text-xs text-gray-500">
                              Total
                            </Label>
                            <div className="font-medium text-green-600">
                              {selectedItem
                                ? `₦${(
                                    selectedItem.price * item.quantity
                                  ).toLocaleString()}`
                                : "₦0"}
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={items.length <= 1}
                            className="h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {errors.items && (
                      <p className="text-red-500 text-sm">{errors.items}</p>
                    )}

                    <Button
                      onClick={addItem}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Pricing
                </CardTitle>
                <CardDescription>
                  Set the total price for this combo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Items Total</Label>
                    <div className="text-2xl font-bold text-gray-600">
                      ₦{calculatedTotalPrice.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500">
                      Sum of all selected items
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="totalPrice">Combo Price *</Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      step="0.01"
                      placeholder="Enter combo price"
                      value={totalPrice}
                      onChange={(e) => {
                        setTotalPrice(e.target.value);
                        setUseCalculatedPrice(false);
                      }}
                      className={errors.totalPrice ? "border-red-500" : ""}
                    />
                    {errors.totalPrice && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.totalPrice}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="useCalculatedPrice"
                    checked={useCalculatedPrice}
                    onCheckedChange={setUseCalculatedPrice}
                  />
                  <Label htmlFor="useCalculatedPrice">
                    Use calculated price
                  </Label>
                </div>

                {potentialSavings > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-800 font-medium">
                        Customer saves ₦{potentialSavings.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Advanced Options</CardTitle>
                    <CardDescription>
                      Additional settings and metadata
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Hide" : "Show"}
                  </Button>
                </div>
              </CardHeader>

              {showAdvanced && (
                <CardContent className="space-y-6">
                  {/* Tags */}
                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addTag())
                        }
                      />
                      <Button onClick={addTag} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  <div>
                    <Label>Allergens</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {ALLERGENS.map((allergen) => (
                        <div
                          key={allergen}
                          className="flex items-center space-x-2"
                        >
                          <Switch
                            id={`allergen-${allergen}`}
                            checked={allergens.includes(allergen)}
                            onCheckedChange={() => toggleAllergen(allergen)}
                          />
                          <Label
                            htmlFor={`allergen-${allergen}`}
                            className="text-sm capitalize"
                          >
                            {allergen}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutritional Information */}
                  <div>
                    <Label>Nutritional Information (per serving)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                      {Object.entries(nutritionalInfo).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-xs capitalize">{key}</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={value || ""}
                            onChange={(e) =>
                              setNutritionalInfo((prev) => ({
                                ...prev,
                                [key]: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <Label htmlFor="metaDescription">
                      Meta Description (SEO)
                    </Label>
                    <Textarea
                      id="metaDescription"
                      placeholder="Brief description for search engines..."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      rows={2}
                      maxLength={160}
                      className={errors.metaDescription ? "border-red-500" : ""}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.metaDescription && (
                        <p className="text-red-500 text-sm">
                          {errors.metaDescription}
                        </p>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {metaDescription.length}/160
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Combo Image *
                </CardTitle>
                <CardDescription>
                  Upload an appetizing image of your combo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CldUploadWidget
                    uploadPreset="gdmugccy"
                    onUpload={(result: any) => {
                      setIsUploadingImage(true);
                      handleImageUpload(result);
                    }}
                  >
                    {({ open }) => (
                      <Button
                        onClick={() => open()}
                        variant="outline"
                        className="w-full"
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {imageUrl ? "Change Image" : "Upload Image"}
                      </Button>
                    )}
                  </CldUploadWidget>

                  {imageUrl && (
                    <div className="relative">
                      <Image
                        src={imageUrl}
                        alt="Combo preview"
                        width={300}
                        height={200}
                        className="rounded-lg object-cover w-full h-48"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setImageUrl("")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {errors.imageUrl && (
                    <p className="text-red-500 text-sm">{errors.imageUrl}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            {name && imageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    How your combo will appear to customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg shadow p-3 border">
                    <div className="relative mb-3">
                      <Image
                        src={imageUrl}
                        alt={name}
                        width={200}
                        height={120}
                        className="rounded object-cover w-full h-24"
                      />
                      {featured && (
                        <Badge className="absolute top-1 left-1 bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {!available && (
                        <div className="absolute inset-0 bg-gray-900/50 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {description}
                    </p>

                    {items.filter((item) => item._id).length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Includes:
                        </p>
                        <div className="space-y-1">
                          {items
                            .filter((item) => item._id)
                            .slice(0, 3)
                            .map((item, index) => {
                              const menuItem = getSelectedItemDetails(item._id);
                              return menuItem ? (
                                <div
                                  key={index}
                                  className="text-xs text-gray-600 flex justify-between"
                                >
                                  <span>
                                    {item.quantity}x {menuItem.name}
                                  </span>
                                  <span>
                                    ₦
                                    {(
                                      menuItem.price * item.quantity
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              ) : null;
                            })}
                          {items.filter((item) => item._id).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{items.filter((item) => item._id).length - 3}{" "}
                              more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-bold text-green-600">
                        ₦
                        {totalPrice
                          ? parseFloat(totalPrice).toLocaleString()
                          : "0"}
                      </span>
                      <Button size="sm" className="text-xs px-2 py-1">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={() => saveComboMutation.mutate()}
                  disabled={saveComboMutation.isPending || isLoadingMenuItems}
                  className="w-full"
                  size="lg"
                >
                  {saveComboMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saveComboMutation.isPending
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                    ? "Update Combo"
                    : "Create Combo"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/combos")}
                  className="w-full"
                  disabled={saveComboMutation.isPending}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Form Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Form Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className={name ? "text-green-600" : "text-red-500"}>
                    {name ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Description:</span>
                  <span
                    className={description ? "text-green-600" : "text-red-500"}
                  >
                    {description ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span
                    className={
                      items.filter((item) => item._id).length > 0
                        ? "text-green-600"
                        : "text-red-500"
                    }
                  >
                    {items.filter((item) => item._id).length > 0 ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span
                    className={
                      totalPrice && !isNaN(parseFloat(totalPrice))
                        ? "text-green-600"
                        : "text-red-500"
                    }
                  >
                    {totalPrice && !isNaN(parseFloat(totalPrice)) ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Image:</span>
                  <span
                    className={imageUrl ? "text-green-600" : "text-red-500"}
                  >
                    {imageUrl ? "✓" : "✗"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Status:</span>
                  <span
                    className={available ? "text-green-600" : "text-gray-500"}
                  >
                    {available ? "Available" : "Unavailable"}
                  </span>
                </div>
                {featured && (
                  <div className="text-center">
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      Featured Combo
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

