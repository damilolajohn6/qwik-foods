/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CldUploadWidget } from "next-cloudinary";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, X, Plus, Trash2, Menu } from "lucide-react";
import Image from "next/image";
import { Sidebar } from "@/components/admin/Sidebar";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "react-error-boundary";
import { debounce } from "lodash";

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  images?: { url: string; alt?: string; isPrimary?: boolean }[];
  addOns?: { id: string; name: string; price: number; category?: string }[];
  popular: boolean;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  prepTime?: number;
  allergens?: string[];
  tags?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};

type AddOn = {
  id: string;
  name: string;
  price: number;
  category: string;
};

const categories = [
  "Appetizers",
  "Main Course",
  "Desserts",
  "Beverages",
  "Sides",
];
const addOnCategories = ["extra", "sauce", "side", "drink", "dessert"];
const allergensList = [
  "dairy",
  "eggs",
  "fish",
  "shellfish",
  "tree_nuts",
  "peanuts",
  "wheat",
  "soybeans",
  "sesame",
];

export default function AdminMenu() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<MenuItem>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminMenuForm");
      return saved
        ? JSON.parse(saved)
        : {
            name: "",
            description: "",
            price: "",
            category: "",
            imageUrl: "",
            images: [],
            addOns: [],
            popular: false,
            vegetarian: false,
            vegan: false,
            glutenFree: false,
            prepTime: "",
            allergens: [],
            tags: [],
            nutrition: { calories: "", protein: "", carbs: "", fat: "" },
          };
    }
    return {
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      images: [],
      addOns: [],
      popular: false,
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      prepTime: "",
      allergens: [],
      tags: [],
      nutrition: { calories: "", protein: "", carbs: "", fat: "" },
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImages, setPreviewImages] = useState<
    { url: string; isPrimary: boolean }[]
  >([]);
  const [newAddOn, setNewAddOn] = useState({
    name: "",
    price: "",
    category: "extra",
  });
  const [newTag, setNewTag] = useState("");

  const { refetch, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to fetch menu items");
      return res.json();
    },
  });

  // Persist form data to localStorage
  useEffect(() => {
    localStorage.setItem("adminMenuForm", JSON.stringify(formData));
  }, [formData]);

  const validateField = useCallback(
    debounce((name: string, value: any) => {
      const newErrors = { ...errors };
      switch (name) {
        case "name":
          if (!value) newErrors.name = "Name is required";
          else if (value.length > 100)
            newErrors.name = "Name cannot exceed 100 characters";
          else delete newErrors.name;
          break;
        case "price":
          if (!value || isNaN(parseFloat(value)))
            newErrors.price = "Valid price is required";
          else if (parseFloat(value) <= 0)
            newErrors.price = "Price must be positive";
          else delete newErrors.price;
          break;
        case "category":
          if (!value) newErrors.category = "Category is required";
          else delete newErrors.category;
          break;
        case "prepTime":
          if (
            value &&
            (isNaN(parseFloat(value)) ||
              parseFloat(value) < 1 ||
              parseFloat(value) > 120)
          )
            newErrors.prepTime = "Prep time must be between 1 and 120 minutes";
          else delete newErrors.prepTime;
          break;
      }
      setErrors(newErrors);
    }, 300),
    [errors]
  );

  const addMenuItem = useMutation({
    mutationFn: async () => {
      const validationErrors: Record<string, string> = {};
      if (!formData.name) validationErrors.name = "Name is required";
      if (!formData.price || isNaN(parseFloat(formData.price as any)))
        validationErrors.price = "Valid price is required";
      if (!formData.category)
        validationErrors.category = "Category is required";
      if (
        formData.prepTime &&
        (isNaN(parseFloat(formData.prepTime as any)) ||
          parseFloat(formData.prepTime as any) < 1 ||
          parseFloat(formData.prepTime as any) > 120)
      )
        validationErrors.prepTime =
          "Prep time must be between 1 and 120 minutes";

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error("Validation failed");
      }

      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price as any),
          prepTime: formData.prepTime
            ? parseFloat(formData.prepTime as any)
            : undefined,
          nutrition: {
            calories: formData.nutrition?.calories
              ? parseFloat(formData.nutrition.calories as any)
              : undefined,
            protein: formData.nutrition?.protein
              ? parseFloat(formData.nutrition.protein as any)
              : undefined,
            carbs: formData.nutrition?.carbs
              ? parseFloat(formData.nutrition.carbs as any)
              : undefined,
            fat: formData.nutrition?.fat
              ? parseFloat(formData.nutrition.fat as any)
              : undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to add menu item");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Menu item added successfully!");
      resetForm();
      refetch();
      router.push("/admin/menu");
      localStorage.removeItem("adminMenuForm");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add menu item");
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      images: [],
      addOns: [],
      popular: false,
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      prepTime: "",
      allergens: [],
      tags: [],
      nutrition: { calories: "", protein: "", carbs: "", fat: "" },
    });
    setErrors({});
    setPreviewImages([]);
    setNewAddOn({ name: "", price: "", category: "extra" });
    setNewTag("");
  }, []);

  const handleAddOn = () => {
    if (!newAddOn.name || !newAddOn.price || !newAddOn.category) {
      toast.error("Please fill in all add-on details");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      addOns: [
        ...prev.addOns,
        {
          id: crypto.randomUUID(),
          name: newAddOn.name,
          price: parseFloat(newAddOn.price),
          category: newAddOn.category,
        },
      ],
    }));
    setNewAddOn({ name: "", price: "", category: "extra" });
  };

  const removeAddOn = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      addOns: prev.addOns.filter((addOn) => addOn.id !== id),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleNutritionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      nutrition: { ...prev.nutrition!, [field]: value },
    }));
  };

  const handleImageUpload = (result: any) => {
    if (result?.event === "success") {
      const newImage = {
        url: result.info.secure_url,
        isPrimary: previewImages.length === 0, // First image is primary
      };
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImage],
        imageUrl: newImage.isPrimary ? newImage.url : prev.imageUrl,
      }));
      setPreviewImages((prev) => [...prev, newImage]);
    }
  };

  const removeImage = (url: string) => {
    const newImages = previewImages.filter((img) => img.url !== url);
    const newPrimary = newImages.length > 0 ? newImages[0].url : "";
    setFormData((prev) => ({
      ...prev,
      images: newImages,
      imageUrl: newPrimary,
    }));
    setPreviewImages(newImages);
  };

  const setPrimaryImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.map((img) => ({
        ...img,
        isPrimary: img.url === url,
      })),
      imageUrl: url,
    }));
    setPreviewImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.url === url }))
    );
  };

  const toggleAllergen = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens?.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...(prev.allergens || []), allergen],
    }));
  };

  const addTag = () => {
    if (!newTag.trim()) {
      toast.error("Tag cannot be empty");
      return;
    }
    if (newTag.length > 30) {
      toast.error("Tag cannot exceed 30 characters");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim().toLowerCase()],
    }));
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag),
    }));
  };

  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p>{error.message}</p>
      <Button onClick={resetForm} className="mt-4">
        Reset Form
      </Button>
    </div>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed md:static z-50 bg-white shadow-lg w-64 md:w-72 lg:w-80 p-4 transform transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "md:translate-x-0"
          )}
          aria-hidden={
            !sidebarOpen && !window.matchMedia("(min-width: 768px)").matches
          }
        >
          <Sidebar />
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Mobile menu button */}
          <div className="md:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <div className="container mx-auto max-w-5xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">
              Add New Menu Item
            </h1>

            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Item name"
                      value={formData.name}
                      onChange={(e) => handleInputChange(e, "name")}
                      className={cn(errors.name && "border-red-500")}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="text-red-500 text-sm mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Item description (max 500 characters)"
                      value={formData.description}
                      onChange={(e) => handleInputChange(e, "description")}
                      rows={4}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price * ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={formData.price}
                      onChange={(e) => handleInputChange(e, "price")}
                      className={cn(errors.price && "border-red-500")}
                      aria-invalid={!!errors.price}
                      aria-describedby={
                        errors.price ? "price-error" : undefined
                      }
                    />
                    {errors.price && (
                      <p id="price-error" className="text-red-500 text-sm mt-1">
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger
                        className={cn(errors.category && "border-red-500")}
                        aria-invalid={!!errors.category}
                        aria-describedby={
                          errors.category ? "category-error" : undefined
                        }
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p
                        id="category-error"
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                    <Input
                      id="prepTime"
                      type="number"
                      placeholder="Prep time (1-120)"
                      value={formData.prepTime}
                      onChange={(e) => handleInputChange(e, "prepTime")}
                      className={cn(errors.prepTime && "border-red-500")}
                      aria-invalid={!!errors.prepTime}
                      aria-describedby={
                        errors.prepTime ? "prepTime-error" : undefined
                      }
                    />
                    {errors.prepTime && (
                      <p
                        id="prepTime-error"
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.prepTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Images and Add-ons */}
                <div className="space-y-6">
                  <div>
                    <Label>Image Upload (Multiple)</Label>
                    <CldUploadWidget
                      uploadPreset="foodiehub"
                      onUpload={handleImageUpload}
                    >
                      {({ open }) => (
                        <Button
                          onClick={() => open()}
                          variant="outline"
                          className="w-full"
                        >
                          Upload Images
                        </Button>
                      )}
                    </CldUploadWidget>
                    {previewImages.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {previewImages.map((img) => (
                          <div key={img.url} className="relative">
                            <Image
                              src={img.url}
                              width={150}
                              height={150}
                              alt="Preview"
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <div className="absolute top-1 right-1 flex gap-1">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removeImage(img.url)}
                                aria-label="Remove image"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={img.isPrimary ? "default" : "outline"}
                                size="icon"
                                onClick={() => setPrimaryImage(img.url)}
                                aria-label={
                                  img.isPrimary
                                    ? "Primary image"
                                    : "Set as primary image"
                                }
                              >
                                {img.isPrimary ? "★" : "☆"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Add-ons</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-2 mb-2">
                      <Input
                        placeholder="Add-on name"
                        value={newAddOn.name}
                        onChange={(e) =>
                          setNewAddOn((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={newAddOn.price}
                        onChange={(e) =>
                          setNewAddOn((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                      />
                      <Select
                        value={newAddOn.category}
                        onValueChange={(value) =>
                          setNewAddOn((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add-on category" />
                        </SelectTrigger>
                        <SelectContent>
                          {addOnCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddOn} className="sm:col-span-1">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.addOns?.map((addOn) => (
                        <div
                          key={addOn.id}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded"
                        >
                          <span>
                            {addOn.name} ({addOn.category}) - $
                            {addOn.price.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAddOn(addOn.id)}
                            aria-label={`Remove ${addOn.name} add-on`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dietary Options, Allergens, and Tags */}
              <div className="mt-8 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Dietary Options
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { id: "popular", label: "Popular", field: "popular" },
                      {
                        id: "vegetarian",
                        label: "Vegetarian",
                        field: "vegetarian",
                      },
                      { id: "vegan", label: "Vegan", field: "vegan" },
                      {
                        id: "glutenFree",
                        label: "Gluten Free",
                        field: "glutenFree",
                      },
                    ].map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2"
                      >
                        <Switch
                          id={option.id}
                          checked={
                            formData[option.field as keyof MenuItem] as boolean
                          }
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              [option.field]: checked,
                            }))
                          }
                        />
                        <Label htmlFor={option.id}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Allergens</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {allergensList.map((allergen) => (
                      <div
                        key={allergen}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={allergen}
                          checked={formData.allergens?.includes(allergen)}
                          onChange={() => toggleAllergen(allergen)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <Label htmlFor={allergen}>
                          {allergen.replace("_", " ").charAt(0).toUpperCase() +
                            allergen.replace("_", " ").slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Tags</h2>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add tag (e.g., spicy, healthy)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags?.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        <span>{tag}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove ${tag} tag`}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Nutritional Information
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { id: "calories", label: "Calories", unit: "kcal" },
                      { id: "protein", label: "Protein", unit: "g" },
                      { id: "carbs", label: "Carbs", unit: "g" },
                      { id: "fat", label: "Fat", unit: "g" },
                    ].map((field) => (
                      <div key={field.id}>
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <Input
                          id={field.id}
                          type="number"
                          placeholder={field.unit}
                          value={
                            formData.nutrition![
                              field.id as keyof MenuItem["nutrition"]
                            ]
                          }
                          onChange={(e) => handleNutritionChange(e, field.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-8 flex justify-end space-x-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addMenuItem.mutate()}
                  disabled={addMenuItem.status === "pending" || isLoading}
                >
                  {addMenuItem.status === "pending" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Item"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
