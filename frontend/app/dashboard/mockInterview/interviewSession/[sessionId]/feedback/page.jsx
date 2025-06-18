"use client"
import { db } from '@/utils/db'
import { InterviewPrompt, SessionFeedback, UserAnswer, UserAnswerConversational } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import React, { useEffect, useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Calendar, ChevronDown, ChevronUp, LoaderCircle, MessageSquare, MessageSquareDiff, MessageSquareHeart, MessageSquareMore, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import ReactMarkdown from 'react-markdown'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { useUser } from '@clerk/nextjs'

function Feedback({params}) {

  const [sessionData, setSessionData] = useState()
  const [feedbackList, setFeedbackList] = useState([])
  const [sessionFeedbackData, setSessionFeedbackData] = useState()
  const [dialog, setDialog] = useState([])
  const [recordingURL, setRecordingURL] = useState(null);
  const [openStates, setOpenStates] = useState({})
  const router = useRouter()
  const [openReattempt, setOpenReattempt] = useState(false)
  const [loading, setLoading] = useState(false);
  const {user} = useUser();

  useEffect(() => {
    getSessionDetails()
    getDialog()
    getFeedback()
    getSessionFeedback()
  },[])

  useEffect(() => {
    console.log(dialog)
  },[dialog])

  const getSessionDetails = async() => {
    const sessionData=await db.select()
    .from(InterviewPrompt)
    .where(eq(InterviewPrompt.mockID,params.sessionId))

    setSessionData(sessionData[0])
  }

  const getDialog = async() => {
    const dialogData=await db.select()
    .from(UserAnswerConversational)
    .where(eq(UserAnswerConversational.mockIDRef,params.sessionId))

    if (dialogData[0]?.dialog) {
      const parsedDialog = JSON.parse(dialogData[0].dialog); // clean parse
      setDialog(parsedDialog);
    }
  }
  
  const getFeedback = async() => {
    const feedbackData = await db.select()
    .from(UserAnswer)
    .where(eq(UserAnswer.mockIDRef, params.sessionId))
    .orderBy(UserAnswer.id)

    console.log(feedbackData)
    setFeedbackList(feedbackData)
  }

  const getSessionFeedback = async (timeout = 10000, interval = 1000) => {
    const startTime = Date.now();

    const poll = async () => {
      const sessionFeedback = await db.select()
        .from(SessionFeedback)
        .where(eq(SessionFeedback.mockIDRef, params.sessionId));

      if (sessionFeedback.length > 0) {
        console.log('Feedback loaded:', sessionFeedback);
        setSessionFeedbackData(sessionFeedback);

        const url = sessionFeedback[0]?.recordingURL;
        if (url) {
          setRecordingURL(url);
        }
        return;
      }

      if (Date.now() - startTime < timeout) {
        setTimeout(poll, interval);
      } else {
        console.warn('Session feedback not found after timeout');
      }
    };

    poll();
  };

  const toggleCollapsible = (index) => {
    setOpenStates((prev) => ({
      ...prev,
      [index]: !prev[index], // Toggle only the clicked collapsible
    }));
  };

  const mergeMessagesByRole = (dialog) => {
    const mergedMessages = [];
    let currentMessage = null;
  
    dialog.forEach(msg => {
      if (currentMessage && currentMessage.role === msg.role) {
        // Merge content if the role is the same
        currentMessage.content += " " + msg.content;
      } else {
        // Push the previous merged message if it exists
        if (currentMessage) {
          mergedMessages.push(currentMessage);
        }
        // Start a new message for the current role
        currentMessage = { ...msg };
      }
    });
  
    // Push the last message if exists
    if (currentMessage) {
      mergedMessages.push(currentMessage);
    }
  
    return mergedMessages;
  };
  const mergedDialog = mergeMessagesByRole(dialog)

  // Reattempt Same Session
  const startSameInterview = () => {
      router.push('/dashboard/mockInterview/interviewSession/'+params.sessionId)
  }

  // Reattempt as New Session
  const startNewInterview = async(e) => {
    setLoading(true)
    e.preventDefault()

    try {
      const mockID = uuidv4(); // Generate new unique Mock ID

      // Reuse previous session details
      const {
        jsonMockResponse,
        jobRole,
        jobDesc,
        quesType,
        numOfQues,
        conversationalMode,
        supportingDoc,
        supportingDocURL,
        isCustom
      } = sessionData;

      // Insert as a new session row
      const resp = await db.insert(InterviewPrompt).values({
        mockID: mockID,
        jsonMockResponse: jsonMockResponse,
        jobRole: jobRole,
        jobDesc: jobDesc,
        quesType: quesType,
        numOfQues: numOfQues,
        conversationalMode: conversationalMode,
        supportingDoc: supportingDoc,
        supportingDocURL: supportingDocURL,
        isCustom: isCustom,
        createdBy: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format('DD-MM-yyyy')
      }).returning({ mockID: InterviewPrompt.mockID });

      if (resp && resp[0]?.mockID) {
        setOpenReattempt(false); // Close dialog
        router.push('/dashboard/mockInterview/interviewSession/' + resp[0]?.mockID);
      } else {
        console.error("Failed to insert new session.");
      }
    } catch (err) {
      console.error("Reattempt failed:", err);
    }
    setLoading(false);
  }

  return (
    <div className='px-12 py-6'>
      <div className='flex flex-col'>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='font-bold text-lg'>{sessionData?.jobRole ? sessionData.jobRole : 'Custom Session'}</h2>
            <h2 className='text-xs mt-1 flex text-gray-400'>
              <Calendar className='w-3.5 h-3.5 mr-1'/>{sessionData?.createdAt}
            </h2>
          </div>
          {recordingURL && (
            <a
              href={recordingURL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="rounded-xl bg-black p-5 hover:bg-[#FF8C00]">
                View Recording
              </Button>
            </a>
          )}
        </div>
        <div className='grid grid-cols-[auto_1fr] gap-y-1 mx-2 w-fit mt-3'>
          <h2 className='text-sm font-semibold'>Job Description</h2>
          <h2 className='text-sm ml-2'>: {sessionData?.jobDesc ? sessionData.jobDesc : '-'}</h2>

          <h2 className='text-sm font-semibold'>Question Type</h2>
          <h2 className='text-sm ml-2'>: {sessionData?.quesType 
          ? sessionData.quesType.charAt(0).toUpperCase() + sessionData.quesType.slice(1) 
          : '-'}</h2>
          <h2 className='text-sm font-semibold'>Mode</h2>
          {sessionData?.conversationalMode? (
            <h2 className='text-sm ml-2'>: Conversational</h2>
          ):(
            <h2 className='text-sm ml-2'>: Default</h2>
          )}
          {sessionData?.supportingDoc && (
            <>
            <h2 className='text-sm font-semibold'>Supporting Document</h2>
            <h2 className='text-sm ml-2'>
              : {sessionData.supportingDocURL ? (
                <a
                  href={sessionData.supportingDocURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 italic"
                >
                  {sessionData.supportingDoc}
                </a>
              ) : (
                sessionData.supportingDoc
              )}
            </h2>
            </>
          )}
        </div>
      </div>
      
      {/* Individual Ques & Ans Feedback/Dialog (Conversational/Default) */}
      <Separator className='mt-4 mb-5' />
      {sessionData?.conversationalMode? (
      <>
      <h2 className='font-bold mx-2'>Questions</h2>
        {sessionData?.jsonMockResponse && 
          // Check if jsonMockResponse is a string and parse it
          Array.isArray(sessionData.jsonMockResponse) ? sessionData.jsonMockResponse : JSON.parse(sessionData.jsonMockResponse)
          .map((item, index) => (
            <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black my-3 px-8 py-8 justify-between h-auto' key={index}>
              <Collapsible>
                <CollapsibleTrigger onClick={() => toggleCollapsible(index)} className='font-bold text-left flex justify-between gap-2 w-full'>
                  {index + 1}. {item.question}
                  {openStates[index] ? <ChevronUp /> : <ChevronDown />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className='flex flex-col bg-[#40E0D0] rounded-xl border border-black mt-5 px-6 py-5 justify-between h-auto'>
                    <h2 className='text-sm flex'><MessageSquareHeart className='w-5 h-5 mr-2'/><strong>Suggested Answer: </strong></h2>
                    <h2 className='text-sm mt-2 mx-2'><ReactMarkdown>{item.answer}</ReactMarkdown></h2>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
        ))}
      <Separator className='mt-4 mb-5' />
      <h2 className='font-bold mx-2'>Dialog</h2>
      <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black my-3 p-5 justify-between h-auto'>
        {mergedDialog.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`flex flex-col max-w-xs p-4 m-2 rounded-xl text-sm ${message.role === 'assistant' ? 'bg-white' : 'bg-[#9C02CE] text-white'}`}
              style={{ maxWidth: '80%' }}
            >
              {/* <strong>{message.role === 'assistant' ? 'Interviewer' : 'You'}:</strong> */}
              <p>{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      </>
      ):(
        
      <>
      <h2 className='font-bold mx-2'>Feedback</h2>
      {feedbackList?.length == 0?
      <h2 className='text-center text-sm italic my-6'> No interview record found.. Start attempting the questions now</h2>
      :
      <>

      {feedbackList && feedbackList.map((item, index) => (
        <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black my-3 px-8 py-8 justify-between h-auto'>
        <Collapsible key={index}>
          <CollapsibleTrigger onClick={() => toggleCollapsible(index)} className='font-bold text-left flex justify-between gap-2 w-full'>{index + 1}. {item.question}{openStates[index] ? <ChevronUp /> : <ChevronDown />}</CollapsibleTrigger>
          <CollapsibleContent>
            <div className='px-5'>
              <h2 className='text-sm mt-5'><strong>Your Answer: </strong></h2>
              <h2 className='text-sm mt-1'>{item.userAns}</h2> 
            </div>
            {item.audioURL && (
              <div className="flex justify-center my-3">
                <audio controls src={item.audioURL} />
              </div>
            )}
            <div className='flex flex-col bg-[#40E0D0] rounded-xl border border-black my-3 px-6 py-5 justify-between h-auto'>
              <h2 className='text-sm flex'><MessageSquare className='w-5 h-5 mr-2'/><strong>Feedback: </strong></h2>
              <h2 className='text-sm mt-2 mx-2'><ReactMarkdown>{item.feedback}</ReactMarkdown></h2>
            </div>
            <div className='flex flex-col bg-[#FF8C00] rounded-xl border border-black my-3 px-6 py-5 justify-between h-auto'>
              <h2 className='text-sm flex'><MessageSquareHeart className='w-5 h-5 mr-2'/><strong>Suggested Answer: </strong></h2>
              <h2 className='text-sm mt-2 mx-2'><ReactMarkdown>{item.suggestedAns}</ReactMarkdown></h2>
            </div>
            <div className='grid grid-cols-[auto_1fr] gap-y-1 w-fit mt-5 px-5'>
              <div className='flex items-center'>
                <Star className='w-5 h-5 mr-2' />
                <h2 className='text-sm font-bold'>Rating</h2>
              </div>
              <h2 className='text-sm ml-2'>: {item.rating} / 10</h2>
              <div className='flex items-center'>
                <MessageSquareDiff className='w-5 h-5 mr-2' />
                <h2 className='text-sm font-bold'>Answer Similarity Score</h2>
              </div>
              <h2 className='text-sm ml-2'>: {item.similarityScore} %</h2>
            </div>
          </CollapsibleContent>
        </Collapsible>
        </div>
      ))}
      </>}
      </>
      )}

      {/* Overall Session Feedback */}
      <Separator className='mt-4 mb-5' />
      {sessionFeedbackData?.length > 0 && (
      <div>
        <h2 className='font-bold text-lg mb-3'>Summary</h2>
        <div className="grid gap-3 h-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#05060B]/90 rounded-2xl border border-black px-10 py-4 flex flex-col items-center justify-center h-full">
              <h2 className="text-sm text-white text-center">Overall Rating</h2>
              <h2 className="font-bold text-4xl text-white text-center mt-2">
                {sessionFeedbackData?.[0]?.overallRating}/10
              </h2>
            </div>
            <div className="col-span-2 bg-[#05060B]/90 rounded-2xl border border-black px-12 pt-5 pb-3 h-full">
              {[
                { title: "Problem Solving", value: sessionFeedbackData?.[0]?.probSolRating },
                { title: "Communication", value: sessionFeedbackData?.[0]?.commRating },
                { title: "Technical Knowledge", value: sessionFeedbackData?.[0]?.techRating },
                { title: "Confidence & Clarity", value: sessionFeedbackData?.[0]?.confRating }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 mb-3">
                  <span className="text-white text-sm font-semibold w-1/3">{item.title}</span>

                  <div className="flex-1 h-2 bg-gray-700 rounded-md relative">
                    <div
                      className="h-full bg-gradient-to-r from-[#FCAA0B] to-[#9C02CE] rounded-md"
                      style={{ width: `${(item.value / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white text-sm font-semibold w-[40px] text-right">{item.value}/10</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-[#05060B]/90 rounded-2xl border border-black mb-3 px-8 py-6 text-white">
              <h2 className="text-lg font-semibold mb-3">Areas for Improvement</h2>
              <p className="text-sm whitespace-pre-line">
                {sessionFeedbackData?.[0]?.areaImprovement}
              </p>
              <h2 className="text-lg font-semibold mt-6 mb-3">Advice</h2>
              <p className="text-sm">{sessionFeedbackData?.[0]?.advice}</p>
            </div>
          </div>
        </div>
        <h2 className='italic text-[10px] text-gray-500 text-right mb-3'>Note: The ratings and feedback provided are subjective and intended as guidance to help you improve. Use them as a reference to refine your skills and enhance your interview performance! </h2>
      </div>
      )}
      <div className='flex justify-center gap-5'>
        <Button className='rounded-full p-5' onClick = {() => router.replace('/dashboard/mockInterview')}>Back to Dashboard</Button>
        <Button className='bg-[#05060B] rounded-full p-5 hover:bg-gray-800' 
        onClick = {() => setOpenReattempt(true)}>Reattempt</Button>
      </div>
      <Dialog open={openReattempt} onOpenChange={setOpenReattempt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='font-bold mb-3'>🔁 Reattempt Confirmation</DialogTitle>
            <p>Choose how you want to reattempt this interview:</p>
            <ul className="list-disc list-inside text-base text-gray-600 space-y-1">
              <li>
              <strong>Same session:</strong> Continue this session and <span className="text-red-500 font-semibold">overwrite previous answers</span>.
              </li>
              <li>
              <strong>New session:</strong> Create a new session with the same set of questions.
              </li>
            </ul>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenReattempt(false)}>Cancel</Button>
            <Button onClick={startSameInterview} className="bg-[#9C02CE] hover:bg-[#9C02CE]/80">
            Same Session</Button>
            <Button onClick={startNewInterview} disabled={loading}>
              {loading ?
                <>
                <LoaderCircle className="animate-spin" />Loading...
                </>:'New Session'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Feedback