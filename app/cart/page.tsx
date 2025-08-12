"use client";

import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Your Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center mb-4 p-4 border rounded"
            >
              <div>
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p>
                  ${item.price.toFixed(2)} x {item.quantity}
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, parseInt(e.target.value))
                  }
                  className="w-16"
                />
                <Button
                  variant="destructive"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
          <Button onClick={clearCart} className="mt-4 mr-4" variant="outline">
            Clear Cart
          </Button>
          <Link href="/checkout">
            <Button className="mt-4">Proceed to Checkout</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
