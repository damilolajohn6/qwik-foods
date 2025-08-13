/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import Pusher from "pusher-js";
import { toast } from "sonner";
import Image from "next/image";

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
};

type Order = {
  _id: string;
  userId: string;
  items: { menuItemId: MenuItem; quantity: number }[];
  total: number;
  status: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [search, setSearch] = useState("");

  // Auth redirect
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/auth/login");
    } else if (session.user.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Pusher real-time orders
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe("orders");
    channel.bind("new-order", (data: Order) => {
      toast.success("New Order Received!");
      refetchOrders();
    });
    return () => {
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  // Queries
  const { data: menuItems = [], refetch: refetchMenu } = useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      return res.json();
    },
    enabled: !!session?.user && session.user.role === "admin",
  });

  const { data: orders = [], refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      return res.json();
    },
    enabled: !!session?.user && session.user.role === "admin",
  });

  const { data: users = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
    enabled: !!session?.user && session.user.role === "admin",
  });

  // Mutations
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
      toast.success("Menu item added!");
      refetchMenu();
      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setImageUrl("");
    },
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/menu/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Menu item deleted!");
      refetchMenu();
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast.success("Order updated!");
      refetchOrders();
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      toast.success("User role updated!");
      refetchUsers();
    },
  });

  if (status === "loading") {
    return <p className="text-center mt-10">Checking access...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="menu">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="menu">Menu Items</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Menu Items */}
        <TabsContent value="menu">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <Input
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
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
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {menuItems
              .filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((item) => (
                <div key={item._id} className="p-4 border rounded shadow">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={200}
                      height={200}
                      className="w-full h-40 object-cover rounded"
                    />
                  )}
                  <h2 className="font-bold mt-2">{item.name}</h2>
                  <p className="text-sm">{item.description}</p>
                  <p className="font-semibold">${item.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMenuItem.mutate(item._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders">
          <div className="grid gap-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="p-4 border rounded shadow bg-white"
              >
                <h2 className="font-bold">Order #{order._id}</h2>
                <p>Total: ${order.total.toFixed(2)}</p>
                <p>Status: {order.status}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateOrderStatus.mutate({
                        id: order._id,
                        status: "completed",
                      })
                    }
                  >
                    Mark Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      updateOrderStatus.mutate({
                        id: order._id,
                        status: "cancelled",
                      })
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <div className="grid gap-4">
            {users.map((user) => (
              <div key={user._id} className="p-4 border rounded shadow">
                <h2 className="font-bold">{user.name}</h2>
                <p>{user.email}</p>
                <p>Role: {user.role}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateUserRole.mutate({ id: user._id, role: "admin" })
                    }
                  >
                    Make Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateUserRole.mutate({ id: user._id, role: "user" })
                    }
                  >
                    Make User
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
