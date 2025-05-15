"use client"
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

    const defaultInterviews = pastInterviewList.filter((item) => item.isCustom === false)
    const customInterviews = pastInterviewList.filter((item) => item.isCustom === true)

  return (
    <div>
        <Separator className='my-4'/>
        <h2 className='font-bold text-lg mb-3'>Past Sessions</h2>
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="font-semibold">All</TabsTrigger>
                <TabsTrigger value="default" className="font-semibold">Default</TabsTrigger>
                <TabsTrigger value="custom" className="font-semibold">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                {pastInterviewList.length > 0 ? (
                    pastInterviewList.map((interview, index) => (
                    <InterviewItemCard
                        key={index}
                        interview={interview}
                        removeInterview={removeInterview}
                    />
                    ))
                ) : (
                    <p className="text-sm italic text-gray-500 col-span-full">No sessions found.</p>
                )}
                </div>
            </TabsContent>
            
            <TabsContent value="default">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                    {defaultInterviews.length > 0 ? (
                    defaultInterviews.map((interview, index) => (
                        <InterviewItemCard key={index} interview={interview} removeInterview={removeInterview} />
                    ))
                    ) : (
                    <p className="text-sm italic text-gray-500 col-span-full">No default sessions found.</p>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="custom">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                    {customInterviews.length > 0 ? (
                    customInterviews.map((interview, index) => (
                        <InterviewItemCard key={index} interview={interview} removeInterview={removeInterview} />
                    ))
                    ) : (
                    <p className="text-sm italic text-gray-500 col-span-full">No custom sessions found.</p>
                    )}
                </div>
            </TabsContent>
        </Tabs>
        {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {pastInterviewList && pastInterviewList.map((interview, index) =>(
                <InterviewItemCard 
                interview={interview}
                key={index}
                removeInterview={removeInterview} />
            ))}
        </div> */}
    </div>
  )
}

export default PastInterviewList