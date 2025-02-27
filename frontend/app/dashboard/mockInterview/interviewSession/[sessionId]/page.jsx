"use client"
import { Button } from '@/components/ui/button'
import { Switch } from "@/components/ui/switch"
import { db } from '@/utils/db'
import { InterviewPrompt } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { Camera, Lightbulb, Mic, Video, WebcamIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'

function InterviewSession({params}) {
    const[interviewData, setInterviewData]=useState();
    const[webcamEnabled, setWebcamEnabled]=useState(false);

    useEffect(()=>{
        console.log(params.sessionId);
        GetInterviewDetails();
    },[])

    // Get Interview Prompt Details by mockID/sessionId
    const GetInterviewDetails=async(e)=>{
        const result=await db.select()
        .from(InterviewPrompt)
        .where(eq(InterviewPrompt.mockID,params.sessionId))

        console.log(result)
        setInterviewData(result[0]);
    }
    
    // console.log(interviewData)
    // console.log(interviewData?.jobRole)

    return (
        <div className='flex flex-col justify-center items-center w-full h-full'>
            {/* <h2 className='font-bold text-xl mt-5'>Getting Started</h2> */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 w-full p-5 overflow-auto'>
                    <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black px-8 py-6 justify-between h-auto'>
                        <div className='flex flex-col gap-0'>
                            <h2 className='font-bold text-xl'>Session Details</h2>
                            <h2 className='text-sm text-gray-600'>Mock Session Details</h2>
                            <h2 className='text-base  mt-5'><strong>Job Role/Position: </strong>{interviewData?.jobRole}</h2>
                            <h2 className='text-base mt-3'><strong>Job Scope/Description: </strong>{interviewData?.jobDesc}</h2>
                            <h2 className='text-base mt-3'><strong>Question Type: </strong>{interviewData?.quesType}</h2>
                            <h2 className='text-base mt-3'><strong>Supporting Document: </strong>{interviewData?.supportingDoc}</h2>
                        </div>
                        <div className='p-5 border rounded-lg border-black bg-[#40E0D0] text-black flex items-start gap-3'>
                            <div className='mt-1'>
                                <Lightbulb/>
                            </div>
                            <div className='flex flex-col mt-1'>
                                <h2><strong>Information</strong></h2>
                                <h2>Enable Webcam and Microphone to start your Mock Interview</h2>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col h-full gap-3 w-full'>
                        <div className='flex-1 bg-[#05060B] rounded-2xl border border-black px-8 py-6'>
                            <div className='flex flex-col gap-0'>
                                <h2 className='font-bold text-xl text-white'>Camera Preview</h2>
                                <h2 className='text-sm text-gray-200'>For a more immense experience</h2>
                            </div>
                            <div className='flex flex-col items-center justify-center'>
                                {webcamEnabled? <Webcam
                                onUserMedia={()=>setWebcamEnabled(true)}
                                onUserMediaError={()=>setWebcamEnabled(false)}
                                audio={true}
                                mirrored={true}
                                style={{
                                    height:200,
                                    width:200
                                }}/>
                                :
                                <>
                                <WebcamIcon className='h-40 w-60 my-3 p-120 bg-secondary rounded-lg border'/>
                                <Button onClick={()=>setWebcamEnabled(true)}>Enable Webcam & Microphone</Button>
                                </>
                                }
                            </div>
                        </div>
                        <div className='flex-1 bg-[#05060B] rounded-2xl border border-black px-8 py-6'>
                            <div className='flex flex-col gap-0'>
                                <h2 className='font-bold text-xl text-white'>Session Configuration</h2>
                                <h2 className='text-sm text-gray-200'>Set up ....</h2>
                            </div>
                            <div className='flex flex-col gap-1 mt-5'>
                                <div className='flex items-center justify-between p-2 rounded-lg'>
                                    <div className='flex items-center gap-3'>
                                        <Camera className='text-white' size={24} />
                                        <h2 className='text-white text-sm'>Camera</h2>
                                    </div>
                                    <Switch 
                                        checked={false}
                                    />
                                </div>
                                <div className='flex items-center justify-between p-2 rounded-lg'>
                                    <div className='flex items-center gap-3'>
                                        <Mic className='text-white' size={24} />
                                        <h2 className='text-white text-sm'>Microphone</h2>
                                    </div>
                                    <Switch 
                                        checked={false}
                                    />
                                </div>
                                <div className='flex items-center justify-between p-2 rounded-lg'>
                                    <div className='flex items-center gap-3'>
                                        <Video className='text-white' size={24} />
                                        <h2 className='text-white text-sm'>Record Session</h2>
                                    </div>
                                    <Switch 
                                        checked={false}
                                    />
                                </div> 
                            </div>
                            <div className='flex justify-center'>
                                <Button>Start Now</Button>
                            </div>
                            
                        </div>
                    </div>
                </div>
        </div>
  )
}

export default InterviewSession