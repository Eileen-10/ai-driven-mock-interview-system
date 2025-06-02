import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"  
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, LoaderCircle, Play, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/utils/db'
import { InterviewPrompt } from '@/utils/schema'
import moment from 'moment'
import { useUser } from '@clerk/nextjs'

function InterviewItemCard({interview, removeInterview}) {

    const router = useRouter()
    const {user} = useUser();
    const [open, setOpen] = useState(false) // Controls the session dlt dialog state
    const [openReattempt, setOpenReattempt] = useState(false) // Controls the session dlt dialog state
    const [loading, setLoading] = useState(false);

    const deleteSession = async() => {
        if (!interview?.id) return;

        try {
            const res = await fetch('../api/interviewPrompt/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: interview.id }),
            });

            const data = await res.json();
            if (data.success) {
                removeInterview(interview.id); // Refresh page to update list
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error deleting interview:', error);
            alert('Failed to delete interview.');
        } finally {
            setOpen(false); // Close dialog
        }
    }
    
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
            } = interview;

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

    const startSameInterview = () => {
        router.push('/dashboard/mockInterview/interviewSession/'+interview?.mockID)
    }

    const viewFeedback = () => {
        router.push('/dashboard/mockInterview/interviewSession/'+interview?.mockID+'/feedback')
    }

  return (
    <div className={`border border-black rounded-xl p-5 hover:shadow-lg ${
    interview?.isCustom ? 'bg-[#FF8C00]/10' : 'bg-[#F2465E]/10'}`}>
        <h2 className='font-bold'>{interview?.jobRole ? interview.jobRole : 'Custom Session'}</h2>
        <div className='flex flex-wrap gap-2 mt-2'>
            <Badge variant="outline" className="bg-[#9C02CE] text-white">
            {interview?.quesType 
            ? interview.quesType.charAt(0).toUpperCase() + interview.quesType.slice(1) 
            : '-'}
            </Badge>
            <Badge variant="outline" className="bg-[#FF8C00] text-white">
            {interview?.conversationalMode ? 'Conversational Mode' : 'Default Mode'}
            </Badge>
        </div>
        <h2 className='text-xs italic mt-2'>{interview?.jobDesc ? interview.jobDesc : '-'}</h2>
        <div className='mt-3 flex flex-row items-center justify-between'>
            <h2 className='text-xs text-gray-500'>{interview?.createdAt}</h2>
            <div className='flex gap-1 ml-auto'>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size='sm' variant='outline' className="hover:bg-[#05060B] hover:text-white"
                            onClick = {() => setOpen(true)}><Trash2 /></Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-500 text-white">Delete</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size='sm' variant='outline' className="hover:bg-[#F2465E] hover:text-white"
                            onClick = {() => setOpenReattempt(true)}><Play /></Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-500 text-white">Reattempt</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size='sm' variant='outline' className="hover:bg-[#FF8C00] hover:text-white"
                            onClick = {viewFeedback}><Eye /></Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-500 text-white">View Feedback</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='font-bold mb-3'>⚠️ Confirm Deletion</DialogTitle>
                    <p>Are you sure you want to delete this interview session?</p>
                    <p>This action cannot be undone.</p>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={deleteSession}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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

export default InterviewItemCard