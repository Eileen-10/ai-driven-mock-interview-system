import React from 'react'
import Header from './_components/Header'

function DashboardLayout({children}) {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header/>
      <div className="flex flex-grow h-[calc(100vh-60px)]">
        
        {/* Sidebar */}
        <div className="h-screen p-1 rounded-lg shadow-md">
          {/* Add sidebar content here */}
          Sidebar
        </div>

        {/* Content */}
        <div className='flex-grow bg-white rounded-3xl shadow-lg' style={{ marginRight: '20px', marginTop: '6px', marginBottom: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout