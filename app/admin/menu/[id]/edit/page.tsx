/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {Sidebar} from "@/components/admin/Sidebar";
import Image from "next/image";
import { toast } from "sonner";

interface MenuItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
}

export default function EditMenuItemPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fetch menu item
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/menu/${id}`);
        if (!res.ok) throw new Error("Failed to fetch menu item");
        const data = await res.json();
        setFormData(data);
      } catch (error) {
        toast.error("Error loading menu item");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData = new FormData();
    updatedData.append("title", formData.title || "");
    updatedData.append("description", formData.description || "");
    updatedData.append("price", String(formData.price || 0));
    if (formData.oldPrice)
      updatedData.append("oldPrice", String(formData.oldPrice));
    if (imageFile) updatedData.append("image", imageFile);

    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PUT",
        body: updatedData,
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Menu item updated successfully");
      router.push("/admin/menu");
    } catch (error) {
      toast.error("Failed to update menu item");
    }
  };

  if (loading) return <p className="text-center p-6">Loading...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Edit Menu Item</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto space-y-4"
        >
          {/* Image Preview */}
          {formData.image && !imageFile && (
            <Image
              src={formData.image}
              alt={formData.title || "Menu Image"}
              width={200}
              height={200}
              className="rounded-lg"
            />
          )}

          {/* Image Upload */}
          <div>
            <label className="block font-semibold">Change Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold">Description</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
              rows={4}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block font-semibold">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          {/* Old Price */}
          <div>
            <label className="block font-semibold">Old Price (optional)</label>
            <input
              type="number"
              name="oldPrice"
              value={formData.oldPrice || ""}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
