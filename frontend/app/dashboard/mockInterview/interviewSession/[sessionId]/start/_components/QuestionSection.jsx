"use client"
import { CircleArrowRight, Lightbulb, Volume2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import RecordAnswerSection from './RecordAnswerSection'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { db } from '@/utils/db'
import { eq } from 'drizzle-orm'
import { InterviewPrompt, SessionFeedback, UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import moment from 'moment'

function QuestionSection({mockInterviewQuestion, selectedCamera, setSelectedCamera, selectedMicrophone, setSelectedMicrophone, webcamRef, interviewData, params, recordingStatus, onEndCall, recordingURL}) {
    const {user} = useUser()
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
    const [sessionData, setSessionData] = useState()
    const [feedbackList, setFeedbackList] = useState([])
    const recordingUrlRef = useRef(recordingURL);
    const [interviewEnded, setInterviewEnded] = useState(false);

    useEffect(() => {
        recordingUrlRef.current = recordingURL;
    }, [recordingURL]);

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

    const generateSessionFeedback = async() => {
        onEndCall(); // Stop screen recording
        setInterviewEnded(true);

        try {
            // Get data for session (Job Role, Desc)
            const sessionData = await db.select()
            .from(InterviewPrompt)
            .where(eq(InterviewPrompt.mockID, params.sessionId));
    
            if (!sessionData || sessionData.length === 0) {
                console.error("No session data found.");
                return;
            }
            setSessionData(sessionData[0])
        
            // Get data for each ques (Ques, userAns, feedback)
            const feedbackData = await db.select()
            .from(UserAnswer)
            .where(eq(UserAnswer.mockIDRef, params.sessionId))
            .orderBy(UserAnswer.id)
            
            if (!feedbackData || feedbackData.length === 0) {
                console.error("No feedback data found.");
                return;
            }
            console.log(feedbackData)
            setFeedbackList(feedbackData)

            const responses = feedbackData.map((item) => ({
                question: item.question,
                user_answer: item.userAns,
                feedback: item.feedback
            }));

            console.log(sessionData[0]?.jobRole)
            console.log(sessionData[0]?.jobDesc)
            console.log(responses)

            // Call for LLM in FastAPI
            const response = await fetch("http://127.0.0.1:8000/evaluate-session/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_role: sessionData[0]?.jobRole,
                    job_desc: sessionData[0]?.jobDesc,
                    responses: responses
                }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to generate session feedback");
            }
            const sessionFeedback = await response.json();
            console.log("Session Feedback:", sessionFeedback);

            // Wait for recording URL to be ready
            let attempts = 0;
            while (!recordingUrlRef.current && attempts < 10) {
            console.log("Waiting for recording URL...");
            await new Promise((resolve) => setTimeout(resolve, 500));
            attempts++;
            }

            const finalRecordingURL = recordingUrlRef.current || null;
    
            // Store in SessionFeedback db
            if (sessionFeedback){
                const resp=await db.insert(SessionFeedback)
                .values({
                  mockIDRef:sessionData[0]?.mockID,
                  overallRating:sessionFeedback?.session_feedback?.overall_rating,
                  probSolRating:sessionFeedback?.session_feedback?.rate_probSol,
                  commRating:sessionFeedback?.session_feedback?.rate_comm,
                  techRating:sessionFeedback?.session_feedback?.rate_tech,
                  confRating:sessionFeedback?.session_feedback?.rate_conf,
                  areaImprovement:sessionFeedback?.session_feedback?.area_improvement,
                  advice:sessionFeedback?.session_feedback?.advice,
                  recordingURL:finalRecordingURL,
                  createdBy:user?.primaryEmailAddress?.emailAddress,
                  createdAt:moment().format('DD-MM-yyyy')
                })
            
                if(resp){
                  console.log("Answer & Feedback saved successfully")
                }
            }

        } catch (error) {
            console.error("Error generating session feedback:", error);
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
                    <Button onClick={generateSessionFeedback} className='bg-black'><CircleArrowRight />End Interview</Button>
                    </Link>
                    }
                </div>
            </div>
            <div>
                <RecordAnswerSection
                selectedCamera={selectedCamera} 
                setSelectedCamera={setSelectedCamera}
                selectedMicrophone={selectedMicrophone} 
                setSelectedMicrophone={setSelectedMicrophone}
                webcamRef={webcamRef}
                mockInterviewQuestion={mockInterviewQuestion}
                activeQuestionIndex={activeQuestionIndex}
                interviewData={interviewData}
                recordingStatus={recordingStatus}
                recordingURL={recordingURL}
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