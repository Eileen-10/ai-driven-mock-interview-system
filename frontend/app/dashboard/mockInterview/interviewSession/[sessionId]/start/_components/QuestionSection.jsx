"use client"
import { CircleArrowRight, Lightbulb, Volume2 } from 'lucide-react'
import React, { useState } from 'react'
import RecordAnswerSection from './RecordAnswerSection'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function QuestionSection({mockInterviewQuestion, selectedCamera, selectedMicrophone, webcamRef, interviewData}) {
    
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    const handleNextQuestion = () => {
        if (activeQuestionIndex < mockInterviewQuestion.length - 1) {
            setActiveQuestionIndex(activeQuestionIndex + 1);
        }
    };

    const textToSpeech=(text)=>{
        if('speechSynthesis' in window){
            const speech=new SpeechSynthesisUtterance(text)
            window.speechSynthesis.speak(speech)
        } else {
            alert("Sorry, your browser does not support text-to-speech")
        }
    }

    return mockInterviewQuestion && (
        <div>
            <div className='flex justify-between items-center gap-3'>
                <div className='p-2'>
                    <h2 className='text-xs mb-2'>Question {activeQuestionIndex+1}:</h2>
                    <h2 className='font-bold md:text-md mb-1'>{mockInterviewQuestion[activeQuestionIndex]?.question}</h2>
                    <Volume2 size={15} className='cursor-pointer' onClick={()=>textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question)} />
                </div>
                <div>
                    {activeQuestionIndex!=mockInterviewQuestion?.length-1 && <Button className='bg-black' onClick={handleNextQuestion}><CircleArrowRight />Next Question</Button>}
                    {activeQuestionIndex==mockInterviewQuestion?.length-1 && 
                    <Link href={'/dashboard/mockInterview/interviewSession/'+interviewData?.mockID+'/feedback'}>
                    <Button className='bg-black'><CircleArrowRight />End Interview</Button>
                    </Link>}
                </div>
            </div>
            <div>
                <RecordAnswerSection
                selectedCamera={selectedCamera} 
                selectedMicrophone={selectedMicrophone} 
                webcamRef={webcamRef}
                mockInterviewQuestion={mockInterviewQuestion}
                activeQuestionIndex={activeQuestionIndex}
                interviewData={interviewData}
                />
            </div>
            <div className='mt-3 p-5 border rounded-lg border-black bg-[#40E0D0] text-black flex items-start gap-3'>
                <div className='mt-1'>
                    <Lightbulb fill='#F9F6B1'/>
                </div>
                <div className='flex flex-col mt-1'>
                    <h2 className='text-base'><strong>Information</strong></h2>
                    <h2 className='text-sm  mt-1'>Once you click "Next Question," you <strong>CANNOT</strong> navigate back to the previous question. <br />This is to ensure a more realistic interview experience.</h2>
                    <h2 className='italic text-sm mt-2'><strong>Note:</strong> Webcam and recording can be disabled at any time during the session.</h2>
                </div>
            </div>
        </div>
        
        
    )
}

export default QuestionSection