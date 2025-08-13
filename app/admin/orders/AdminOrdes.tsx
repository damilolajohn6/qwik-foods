"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import Image from "next/image";

type OrderItem = {
  menuItemId: { name: string; price: number; imageUrl?: string };
  quantity: number;
};

type Order = {
  _id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};

export default function AdminOrders() {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders
  const { data: orders = [], refetch } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      return res.json();
    },
  });

  // Mutation to update order status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  // Real-time updates via Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("orders");
    channel.bind("new-order", () => {
      refetch();
    });

    return () => {
      pusher.unsubscribe("orders");
    };
  }, [refetch]);

  // Redirect non-admins
  if (session?.user.role !== "admin") {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return null;
  }

  // Filtering
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Orders</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <Input
          placeholder="Search by ID, name, or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order._id}>
              <TableCell>{order._id}</TableCell>
              <TableCell>
                {order.customerName || "N/A"} <br />
                <span className="text-sm text-gray-500">
                  {order.customerEmail}
                </span>
              </TableCell>
              <TableCell>${order.total.toFixed(2)}</TableCell>
              <TableCell className="capitalize">{order.status}</TableCell>
              <TableCell>
                {new Date(order.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                >
                  View
                </Button>
                <Select
                  onValueChange={(value) =>
                    updateStatus.mutate({ id: order._id, status: value })
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="out-for-delivery">
                      Out for Delivery
                    </SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Order Details Modal */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div>
              <p>
                <strong>Order ID:</strong> {selectedOrder._id}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.customerName} (
                {selectedOrder.customerEmail})
              </p>
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Total:</strong> ${selectedOrder.total.toFixed(2)}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
              <hr className="my-3" />
              <h3 className="font-bold mb-2">Items</h3>
              <ul className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    {item.menuItemId.imageUrl && (
                      <Image
                        src={item.menuItemId.imageUrl}
                        alt=""
                        width={400}
                        height={400}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <span>
                      {item.menuItemId.name} × {item.quantity} — $
                      {(item.menuItemId.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
