import React from "react";
import Checkout from "./Checkout";
import ClientWrapper from "../admin/client-wrapper";

const CheckoutPage = () => {
  return (
    <div>
      <ClientWrapper>
        <Checkout />
      </ClientWrapper>
    </div>
  );
};

export default CheckoutPage;
