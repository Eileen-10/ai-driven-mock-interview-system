import React from 'react'
import { Badge } from '@/components/ui/badge'

function QuestionItemCard({question}) {
  return (
    <div className='bg-[#F2465E]/10 border border-black rounded-xl p-6 px-7 hover:shadow-lg'>
        <h2 className='font-bold'>{question?.question}</h2>
        <div className='flex flex-wrap gap-2 mt-3'>
            <Badge variant="outline" className="bg-[#9C02CE] text-white">
            {question?.quesType.charAt(0).toUpperCase() + question?.quesType.slice(1)}
            </Badge>
            <Badge variant="outline" className="bg-[#FF8C00] text-white">
            {question?.category.replace(/\b\w/g, (char) => char.toUpperCase())}
            </Badge>
            {question?.jobRole && (
                <Badge variant="outline" className="bg-[#40E0D0] text-white">
                {question?.jobRole.replace(/\b\w/g, (char) => char.toUpperCase())}
                </Badge>
            )}
        </div>
        
        {/* <div className='mt-3 flex flex-row items-center justify-between'>
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
        </Dialog> */}
    </div>
  )
}

export default QuestionItemCard