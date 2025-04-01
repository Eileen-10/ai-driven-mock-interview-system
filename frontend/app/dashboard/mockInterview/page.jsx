import { UserButton } from '@clerk/nextjs'
import React from 'react'
import NewInterview from '../_components/NewInterview'
import PastInterviewList from '../_components/PastInterviewList'

function mockInterview() {
  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Mock Interview</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Create and start your AI Mock Interview here! 🚀</h2>

      <div className='grid grid-cols-1 md:grid-cols-5 my-5'>
        <NewInterview/>
      </div>
      <PastInterviewList/>
    </div>
  )
}

export default mockInterview