import { UserButton } from '@clerk/nextjs'
import React from 'react'
import NewInterview from '../_components/NewInterview'

function mockInterview() {
  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Mock Interview</h2>
      <h2 className='font-bold text-sm pt-1 text-[#BFBEBE]'>Create and start your AI Mock Interview here! 🚀</h2>

      <div className='grid grid-cols-1 md:grid-cols-5 my-5'>
        <NewInterview/>
      </div>
    </div>
  )
}

export default mockInterview