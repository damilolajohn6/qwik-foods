/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PaystackButton } from "react-paystack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalInKobo = total * 100; // Convert Naira to Kobo for Paystack

  const handlePaymentSuccess = async (reference: { reference: string }) => {
    setLoading(true);
    try {
      // Verify payment on the server
      const verifyResponse = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.reference }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Payment verification failed");
      }

      const verifyData = await verifyResponse.json();
      if (verifyData.status === "success") {
        // Create order after successful payment
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              menuItemId: item.id,
              quantity: item.quantity,
            })),
            total,
            paymentReference: reference.reference,
          }),
        });

        if (orderResponse.ok) {
          clearCart();
          router.push("/orders");
        } else {
          throw new Error("Order creation failed");
        }
      } else {
        throw new Error("Payment not successful");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClose = () => {
    setError("Payment was cancelled");
  };

  const paystackConfig = {
    email: session?.user?.email || "guest@example.com", // Use guest email if not logged in
    amount: totalInKobo, // Amount in kobo
    currency: "NGN",
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    reference: `tx-${Date.now()}`, // Unique transaction reference
    onSuccess: handlePaymentSuccess,
    onClose: handlePaymentClose,
  };

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-primary mb-6">Checkout</h1>
        <p>
          Please{" "}
          <a href="/auth/signin" className="text-blue-600 underline">
            sign in
          </a>{" "}
          to proceed with checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Checkout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between mb-2">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₦{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₦{total.toFixed(2)}</span>
            </div>
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <PaystackButton
            {...paystackConfig}
            text={loading ? "Processing..." : "Pay Now"}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
            disabled={loading || items.length === 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
