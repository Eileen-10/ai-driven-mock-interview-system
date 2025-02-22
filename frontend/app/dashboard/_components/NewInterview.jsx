"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from "@/components/ui/label"

function NewInterview() {
    const [openPrompt, setOpenPrompt]=useState(false)
    const [jobRole, setJobRole]=useState();
    const [jobDesc, setJobDesc]=useState();
    const [quesType, setQuesType]=useState('behavioural');  // Set default to "behavioural"
    const [supportDoc, setSupportDoc]=useState();

    const onSubmit=(e)=>{
        e.preventDefault()
        console.log(jobRole, jobDesc, quesType, supportDoc)
    }

  return (
    <div>
        <div className='p-2 border rounded-lg bg-[#05060B] hover:scale-105 hover:shadow-md cursor-pointer transition-all'
        onClick={()=>setOpenPrompt(true)}>
            <h2 className='font-bold text-white text-sm text-center'>+ Create New</h2>
        </div>
        <Dialog open={openPrompt}>
            <DialogContent className="max-w-xl [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className='text-xl'>Please fill in the details for interview scenario</DialogTitle>
                    <DialogDescription>
                        <form onSubmit={onSubmit}>
                        <div>
                            <h2>Fields marked with <span className="text-red-500">*</span> are required.</h2>
                            <div className='mt-5 my-3'>
                                <label className="text-black font-bold">Job Role/Position <span className="text-red-500">*</span></label>
                                <Input className="bg-gray-100 p-2 rounded-md" placeholder="e.g. Full Stack Developer" required
                                onChange={(event)=>setJobRole(event.target.value)}/>
                            </div>
                            <div className='my-3'>
                                <label className="text-black font-bold">Job Scope/Description <span className="text-red-500">*</span></label>
                                <Textarea className="bg-gray-100 p-2 rounded-md" placeholder="e.g. Frontend (React), Backend (Node.js), etc" required
                                onChange={(event)=>setJobDesc(event.target.value)}/>
                            </div>
                            <div className='my-3'>
                                <label className="text-black font-bold">Question Type <span className="text-red-500">*</span></label>
                                <Select value={quesType} onValueChange={(value) => setQuesType(value)} required>
                                    <SelectTrigger className="w-[180px] bg-gray-100 p-2 rounded-md">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="behavioural">Behavioural</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="combination">Combination</SelectItem>
                                    </SelectContent>
                                    </Select>
                            </div>
                            <div className='my-3'>
                                <label className="text-black font-bold">Supporting Document (Optional)</label>
                                <div className='text-xs mt-1 italic'>** PDF format ONLY</div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Input id="supportDoc" type="file" accept="application/pdf" className="bg-gray-100 p-2 rounded-md" 
                                    onChange={(event)=>setSupportDoc(event.target.value)}/>
                                </div>
                            </div>
                        </div>
                        <div className='flex gap-5 justify-center'>
                            <Button type="button" variant="outline" onClick={()=>setOpenPrompt(false)}>Cancel</Button>
                            <Button type="submit">Launch</Button>
                        </div>
                        </form>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    </div>
  )
}

export default NewInterview