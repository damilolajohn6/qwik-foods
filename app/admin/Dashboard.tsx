/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  
  useEffect(() => {
    if (status === "loading") return; 
    if (!session?.user) {
      router.push("/auth/login"); 
    } else if (session.user.role !== "admin") {
      router.push("/auth/register");
    }
  }, [session, status, router]);

  const { data: menuItems = [], refetch } = useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      return res.json();
    },
    enabled: !!session?.user && session.user.role === "admin",
  });

  const addMenuItem = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category,
          imageUrl,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setImageUrl("");
    },
  });

  // While session is loading
  if (status === "loading") {
    return <p className="text-center mt-10">Checking access...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Admin Dashboard</h1>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Add Menu Item</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <Input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <CldUploadWidget
              uploadPreset="foodiehub"
              onUpload={(result: any) => {
                if (result?.event === "success") {
                  setImageUrl(result.info.secure_url);
                }
              }}
            >
              {({ open }: { open: () => void }) => (
                <Button onClick={() => open()} variant="outline">
                  Upload Image
                </Button>
              )}
            </CldUploadWidget>
            <Button onClick={() => addMenuItem.mutate()}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="mt-6">
        {menuItems.map((item) => (
          <div key={item._id} className="p-4 border rounded mb-4">
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <p>${item.price.toFixed(2)}</p>
            <p>{item.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
