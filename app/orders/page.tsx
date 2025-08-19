import React from "react";
import ClientWrapper from "../admin/client-wrapper";
import Orders from "./UserOrder";

const OrdersPage = () => {
  return (
    <div>
      <ClientWrapper>
        <Orders />
      </ClientWrapper>
    </div>
  );
};

export default OrdersPage;
