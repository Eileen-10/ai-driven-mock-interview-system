"use client"
import { Separator } from '@/components/ui/separator'
import { db } from '@/utils/db';
import { InterviewPrompt } from '@/utils/schema';
import { useUser } from '@clerk/nextjs'
import { desc, eq } from 'drizzle-orm';
import React, { useEffect, useState } from 'react'
import InterviewItemCard from './InterviewItemCard';

function PastInterviewList() {

    const {user} = useUser()
    const [pastInterviewList, setPastInterviewList] = useState([])

    useEffect(() => {
        user && getPastInterviewList()
    },[user])
    
    const getPastInterviewList = async() => {
        const interviewList = await db.select()
        .from(InterviewPrompt)
        .where(eq(InterviewPrompt.createdBy, user?.primaryEmailAddress?.emailAddress))
        .orderBy(desc(InterviewPrompt.id))
        
        console.log(interviewList)
        setPastInterviewList(interviewList)
    }

    // Function to remove deleted interview from state
    const removeInterview = (id) => {
        setPastInterviewList((prevList) => prevList.filter(interview => interview.id !== id));
    }

  return (
    <div>
        <Separator className='my-4'/>
        <h2 className='font-bold text-lg mb-3'>Past Sessions</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {pastInterviewList && pastInterviewList.map((interview, index) =>(
                <InterviewItemCard 
                interview={interview}
                key={index}
                removeInterview={removeInterview} />
            ))}
        </div>
    </div>
  )
}

export default PastInterviewList