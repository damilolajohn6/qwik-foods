"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "@/components/admin/Sidebar";

type MenuItem = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  addOns?: { id: string; name: string; price: number }[];
  popular?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};

export default function AdminMenu() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [search, setSearch] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/auth/login");
    } else if (session.user.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Fetch menu items
  const {
    data: menuItems = [],
    refetch: refetchMenu,
    isLoading,
    isError,
  } = useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to fetch menu");
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!session?.user && session.user.role === "admin",
  });

  // Delete mutation
  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Menu item deleted!");
      refetchMenu();
    },
    onError: () => {
      toast.error("Failed to delete menu item");
    },
  });

  if (status === "loading") {
    return <p className="text-center mt-10">Checking access...</p>;
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-4">
        <div className="flex justify-between my-4">
          <h1 className="text-3xl font-bold text-primary mb-6">Menu Page</h1>
          <div>
            <Link href="/admin/menu/new">
              <Button>Add New Menu</Button>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <Tabs defaultValue="menu">
          <TabsList className="mb-4 flex flex-wrap gap-2">
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            {isLoading ? (
              <p className="text-center">Loading menu...</p>
            ) : isError ? (
              <p className="text-center text-red-500">
                Failed to load menu items.
              </p>
            ) : menuItems.length === 0 ? (
              <p className="text-center">No menu items found.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {menuItems
                  .filter((item) =>
                    item.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((item) => (
                    <div
                      key={item._id}
                      className="p-4 border rounded shadow-sm flex flex-col"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          src={item.imageUrl || "/place.jpg"}
                          alt={item.name}
                          width={300}
                          height={200}
                          className="w-full h-40 object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 mt-2">
                        <h2 className="font-bold">{item.name}</h2>
                        {item.description && (
                          <p className="text-sm">{item.description}</p>
                        )}
                        <p className="font-semibold mt-1">
                          ${item.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/admin/menu/${item._id}/edit`}>
                          <Button size="sm" variant="secondary">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMenuItem.mutate(item._id)}
                          disabled={deleteMenuItem.isPending}
                        >
                          {deleteMenuItem.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
