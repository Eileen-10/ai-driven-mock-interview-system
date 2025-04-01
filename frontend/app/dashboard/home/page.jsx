import { UserButton } from '@clerk/nextjs'
import React from 'react'

function Dashboard() {
  return (
    <div className='pl-12 pt-8'>
      <h2 className='font-bold text-xl'>Dashboard</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Last 30 days</h2>
    </div>
  )
}

export default Dashboard