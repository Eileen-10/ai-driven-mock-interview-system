import React from 'react'
import Header from '../_components/Header'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

function QuestionBankLayout({children}) {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header/>
      <div className="flex flex-grow h-[calc(100vh-60px)]">

        {/* Content */}
        <div className='flex-grow bg-white rounded-3xl shadow-lg overflow-auto' style={{ marginLeft: '20px', marginRight: '20px', marginTop: '6px', marginBottom: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default QuestionBankLayout