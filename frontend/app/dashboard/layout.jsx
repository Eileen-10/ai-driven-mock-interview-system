import React from 'react'
import Header from '../_components/Header'
import AppSidebar from './_components/AppSidebar'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

function DashboardLayout({children}) {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header/>
      <div className="flex flex-grow h-[calc(100vh-60px)]">
        
        {/* Sidebar */}
        <div className="h-screen p-1 rounded-lg shadow-md">
          <AppSidebar />
        </div>

        {/* Content */}
        <div className='flex-grow bg-white rounded-3xl shadow-lg overflow-auto' style={{ marginRight: '20px', marginTop: '6px', marginBottom: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout