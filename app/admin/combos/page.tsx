/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CldUploadWidget } from "next-cloudinary";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ComboItem = {
  _id: string;
  quantity: number;
  name?: string;
  price?: number;
};
type MenuItem = { _id: string; name: string; price: number };
type SpecialCombo = {
  _id: string;
  name: string;
  description: string;
  items: ComboItem[];
  totalPrice: number;
  imageUrl: string;
};

export default function AdminCombos() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ComboItem[]>([{ _id: "", quantity: 1 }]);
  const [totalPrice, setTotalPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch menu items
  const {
    data: menuItems = [],
    isLoading,
    isError,
  } = useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to fetch menu items");
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Calculate total price based on selected items
  const calculatedTotalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const menuItem = menuItems.find((m) => m._id === item._id);
      return sum + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0);
  }, [items, menuItems]);

  // Sync totalPrice with calculated value if not manually set
  useEffect(() => {
    if (!totalPrice || parseFloat(totalPrice) === 0) {
      setTotalPrice(calculatedTotalPrice.toFixed(2));
    }
  }, [calculatedTotalPrice, totalPrice]);

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (items.length === 0 || items.some((item) => !item._id)) {
      newErrors.items = "At least one valid menu item is required";
    }
    if (items.some((item) => item.quantity < 1)) {
      newErrors.items = "Quantity must be at least 1";
    }
    if (
      !totalPrice ||
      isNaN(parseFloat(totalPrice)) ||
      parseFloat(totalPrice) < 0
    ) {
      newErrors.totalPrice = "Valid total price is required";
    }
    if (!imageUrl) newErrors.imageUrl = "Image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add combo mutation
  const addCombo = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error("Please fill in all required fields correctly");
      }
      const res = await fetch("/api/special-combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          items: items.map((item) => ({
            _id: item._id,
            quantity: item.quantity,
          })),
          totalPrice: parseFloat(totalPrice),
          imageUrl,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add combo");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Combo added successfully!");
      router.push("/admin/combos");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add combo");
    },
  });

  // Handle adding a new item
  const addItem = () => {
    setItems([...items, { _id: "", quantity: 1 }]);
  };

  // Handle removing an item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle updating an item
  const updateItem = (
    index: number,
    field: keyof ComboItem,
    value: string | number
  ) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Special Combo</h1>
      {isError && (
        <p className="text-red-500 mb-4">Failed to load menu items.</p>
      )}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Name */}
        <div>
          <Label htmlFor="name">Combo Name</Label>
          <Input
            id="name"
            placeholder="Enter combo name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Items */}
        <div>
          <Label>Combo Items</Label>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center mt-2">
              <Select
                value={item._id}
                onValueChange={(value) => updateItem(index, "_id", value)}
              >
                <SelectTrigger className={errors.items ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Menu Item" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : menuItems.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No menu items available
                    </SelectItem>
                  ) : (
                    menuItems.map((menuItem) => (
                      <SelectItem key={menuItem._id} value={menuItem._id}>
                        {menuItem.name} (${menuItem.price.toFixed(2)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseInt(e.target.value) || 1)
                }
                className="w-20"
                min="1"
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {errors.items && (
            <p className="text-red-500 text-sm mt-1">{errors.items}</p>
          )}
          <Button onClick={addItem} className="mt-2">
            Add Item
          </Button>
        </div>

        {/* Total Price */}
        <div>
          <Label htmlFor="totalPrice">Total Price</Label>
          <Input
            id="totalPrice"
            type="number"
            step="0.01"
            placeholder="Enter total price"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            className={errors.totalPrice ? "border-red-500" : ""}
          />
          {calculatedTotalPrice > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Suggested price based on items: ${calculatedTotalPrice.toFixed(2)}
            </p>
          )}
          {errors.totalPrice && (
            <p className="text-red-500 text-sm mt-1">{errors.totalPrice}</p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <Label>Combo Image</Label>
          <CldUploadWidget
            uploadPreset="gdmugccy"
            onUpload={(result: any) => {
              if (result?.event === "success") {
                setImageUrl(result.info.secure_url);
              }
            }}
          >
            {({ open }) => (
              <Button onClick={() => open()} variant="outline">
                Upload Image
              </Button>
            )}
          </CldUploadWidget>
          {imageUrl && (
            <div className="mt-2">
              <Image
                src={imageUrl}
                alt="Combo preview"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
          )}
          {errors.imageUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => addCombo.mutate()}
          disabled={addCombo.isPending}
          className="w-full"
        >
          {addCombo.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save Combo"
          )}
        </Button>
      </div>
    </div>
  );
}
