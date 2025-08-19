/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";

const Checkout = dynamic(() => import("../checkout/Checkout"), { ssr: false });

export default function CheckoutWrapper({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Checkout />
    </SessionProvider>
  );
}
