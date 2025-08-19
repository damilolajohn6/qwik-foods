/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PaystackButton } from "react-paystack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, CreditCard, Truck } from "lucide-react";

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  deliveryMethod: "pickup" | "delivery";
  paymentMethod: "paystack" | "card" | "bank";
  specialInstructions: string;
}

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    deliveryMethod: "delivery",
    paymentMethod: "paystack",
    specialInstructions: "",
  });

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = formData.deliveryMethod === "delivery" ? 500 : 0; // ₦500 delivery fee
  const total = subtotal + deliveryFee;
  const totalInKobo = total * 100; // Convert Naira to Kobo for Paystack

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone
    ) {
      setError("Please fill in all required contact information.");
      return false;
    }

    if (
      formData.deliveryMethod === "delivery" &&
      (!formData.address || !formData.city)
    ) {
      setError("Please fill in delivery address details.");
      return false;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return false;
    }

    return true;
  };

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
            customerInfo: formData,
            deliveryFee,
            subtotal,
          }),
        });

        if (orderResponse.ok) {
          clearCart();
          router.push("/orders?success=true");
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

  const handleSubmit = () => {
    if (!validateForm()) return;

    // For non-Paystack payments, you might want to handle differently
    if (formData.paymentMethod !== "paystack") {
      setError("Only Paystack payment is currently supported");
      return;
    }
  };

  const paystackConfig = {
    email: formData.email || session?.user?.email || "guest@example.com",
    amount: totalInKobo,
    currency: "NGN" as const,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    reference: `tx-${Date.now()}`,
    onSuccess: handlePaymentSuccess,
    onClose: handlePaymentClose,
  };

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-primary mb-6">Checkout</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="mb-4">Please sign in to proceed with checkout.</p>
              <Button onClick={() => router.push("/auth/signin")}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+234 801 234 5678"
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.deliveryMethod}
                onValueChange={(value) =>
                  handleInputChange("deliveryMethod", value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery (₦500)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Pickup (Free)</Label>
                </div>
              </RadioGroup>

              {formData.deliveryMethod === "delivery" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        placeholder="Lagos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        placeholder="Lagos State"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        handleInputChange("postalCode", e.target.value)
                      }
                      placeholder="100001"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Special Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.specialInstructions}
                onChange={(e) =>
                  handleInputChange("specialInstructions", e.target.value)
                }
                placeholder="Any special delivery instructions..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  handleInputChange("paymentMethod", value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paystack" id="paystack" />
                  <Label htmlFor="paystack">
                    Paystack (Cards, Bank Transfer, USSD)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem value="card" id="card" disabled />
                  <Label htmlFor="card">Credit/Debit Card (Coming Soon)</Label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem value="bank" id="bank" disabled />
                  <Label htmlFor="bank">Bank Transfer (Coming Soon)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      ₦{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₦{deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₦{total.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Payment Button */}
              <div className="pt-4">
                {formData.paymentMethod === "paystack" ? (
                  <PaystackButton
                    {...paystackConfig}
                    text={
                      loading ? "Processing..." : `Pay ₦${total.toFixed(2)}`
                    }
                    className="w-full bg-primary text-white px-4 py-3 rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium"
                    disabled={loading || items.length === 0}
                  />
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || items.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {loading
                      ? "Processing..."
                      : `Place Order - ₦${total.toFixed(2)}`}
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                By placing this order, you agree to our terms and conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
