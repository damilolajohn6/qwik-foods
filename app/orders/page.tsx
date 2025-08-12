/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePusher } from "@/hooks/usePusher";
import { useSession } from "next-auth/react";

export default function Orders() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);

  useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
      return data;
    },
    enabled: !!session,
  });

  usePusher("orders", "new-order", (order: any) => {
    if (order.userId === session?.user.id) {
      setOrders((prev) => [...prev, order]);
    }
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Your Orders</h1>
      {orders.map((order) => (
        <div key={order._id} className="p-4 border rounded mb-4">
          <p>Order ID: {order._id}</p>
          <p>Total: ${order.total.toFixed(2)}</p>
          <p>Status: {order.status}</p>
        </div>
      ))}
    </div>
  );
}
