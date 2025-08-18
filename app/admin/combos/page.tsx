/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CldUploadWidget } from "next-cloudinary";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ComboItem = { _id: string; quantity: number };
type MenuItem = { _id: string; name: string };
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

  const { data: menuItems } = useQuery({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      return res.json();
    },
  });

  const addCombo = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/special-combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          items,
          totalPrice: parseFloat(totalPrice),
          imageUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to add combo");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Combo added!");
      router.push("/admin/combos");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add Special Combo</h1>
      <div className="space-y-4 max-w-md">
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <select
              value={item._id}
              onChange={(e) =>
                setItems(
                  items.map((i, iIndex) =>
                    iIndex === index ? { ...i, _id: e.target.value } : i
                  )
                )
              }
              className="border p-2 rounded"
            >
              <option value="">Select Menu Item</option>
              {menuItems?.map((item: MenuItem) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                setItems(
                  items.map((i, iIndex) =>
                    iIndex === index
                      ? { ...i, quantity: parseInt(e.target.value) || 1 }
                      : i
                  )
                )
              }
              className="w-20"
            />
            <Button
              variant="destructive"
              onClick={() =>
                setItems(items.filter((_, iIndex) => iIndex !== index))
              }
              disabled={items.length <= 1}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button onClick={() => setItems([...items, { _id: "", quantity: 1 }])}>
          Add Item
        </Button>
        <Input
          type="number"
          placeholder="Total Price"
          value={totalPrice}
          onChange={(e) => setTotalPrice(e.target.value)}
        />
        <CldUploadWidget
          uploadPreset="foodiehub"
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
        <Button onClick={() => addCombo.mutate()} disabled={addCombo.status === "pending"}>
          {addCombo.status === "pending" ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
