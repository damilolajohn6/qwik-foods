import ClientWrapper from '@/app/admin/client-wrapper'
import React from 'react'
import EditMenuItem from './AdminEditMenu'

const AdminEditMenuPage = () => {
  return (
    <div>
        <ClientWrapper>
            <EditMenuItem />
        </ClientWrapper>
    </div>
  )
}

export default AdminEditMenuPage