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
import { Eye, Play, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

function InterviewItemCard({interview, removeInterview}) {

    const router = useRouter()
    const [open, setOpen] = useState(false) // Controls the dialog state

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
    
    const startInterview = () => {
        router.push('/dashboard/mockInterview/interviewSession/'+interview?.mockID)
    }

    const viewFeedback = () => {
        router.push('/dashboard/mockInterview/interviewSession/'+interview?.mockID+'/feedback')
    }

  return (
    <div className={`border border-black rounded-xl p-5 hover:shadow-lg ${
    interview?.isCustom ? 'bg-[#FF8C00]/10' : 'bg-[#F2465E]/10'}`}>
        <h2 className='font-bold'>{interview?.jobRole ? interview.jobRole : 'Custom Session'}</h2>
        <h2 className='text-sm'>{interview?.quesType 
        ? interview.quesType.charAt(0).toUpperCase() + interview.quesType.slice(1) 
        : '-'}</h2>
        <h2 className='text-xs italic mt-1'>{interview?.jobDesc ? interview.jobDesc : '-'}</h2>
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
                            onClick = {startInterview}><Play /></Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-500 text-white">Start / Reattempt</TooltipContent>
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
    </div>
  )
}

export default InterviewItemCard