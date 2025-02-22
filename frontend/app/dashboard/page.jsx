import { UserButton } from '@clerk/nextjs'
import React from 'react'

function Dashboard() {
  return (
    <div className='pl-12 pt-8'>
      <h2 className='font-bold text-xl'>Dashboard</h2>
      <h2 className='font-bold text-sm pt-1 text-[#BFBEBE]'>Last 30 days</h2>
    </div>
  )
}

export default Dashboard