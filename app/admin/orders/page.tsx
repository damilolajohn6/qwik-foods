import React from 'react'
import ClientWrapper from '../client-wrapper';
import AdminOrders from './AdminOrdes';

const AdminOrdersPage = () => {
  return (
    <div>
      <ClientWrapper>
        <AdminOrders />
      </ClientWrapper>
    </div>
  )
}

export default AdminOrdersPage;