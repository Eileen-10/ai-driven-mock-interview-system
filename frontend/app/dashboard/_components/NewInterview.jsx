"use client"
import React, { useEffect, useState } from 'react'
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"  
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Info, LoaderCircle } from 'lucide-react'
import { db } from '@/utils/db'
import { InterviewPrompt } from '@/utils/schema'
import { v4 as uuidv4 } from 'uuid'
import { useUser } from '@clerk/nextjs'
import moment from 'moment'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

function NewInterview() {
    const [openPrompt, setOpenPrompt] = useState(false)
    const [jobRole, setJobRole] = useState();                 // Job Role/Position
    const [jobDesc, setJobDesc] = useState();                 // Job Description
    const [quesType, setQuesType] = useState('behavioural');  // Question Type (default: "behavioural")
    const [numOfQues, setNumOfQues] = useState(5);            // Number of Questions
    const [supportDoc, setSupportDoc] = useState(null);       // Supporting Document
    let fileName = supportDoc ? supportDoc.name : null;     // Extract pdf file name
    const [fileURL, setFileURL] = useState('');             // Uploaded support doc URL
    const [loading, setLoading] = useState(false);
    const [jsonResponse, setJsonResponse] = useState([]);
    const router = useRouter();
    const {user} = useUser();
    const [isConversationalMode, setIsConversationalMode] = useState(false)

    const handleFileChange = (event) => {
        setSupportDoc(event.target.files[0]); // Set the actual file
    };

    const onSubmit=async(e)=>{
        setLoading(true)
        e.preventDefault()
        // console.log(jobRole, jobDesc, quesType, supportDoc)

        const mockID = uuidv4();  

        // if(supportDoc){fileUpload(mockID)};
        
        const formData = new FormData();
        formData.append("job_role", jobRole);
        formData.append("job_desc", jobDesc);
        formData.append("ques_type", quesType);
        formData.append("num_ques", numOfQues);
        if (supportDoc) {
            formData.append("support_doc", supportDoc);
        }

        // Call for OCR & LLM from FastAPI
        // To generate Interview Questions & Suggested Answers
        try {
            const response = await fetch("http://127.0.0.1:8000/generate-question", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Generated Questions & Suggested Answers:", data.questions);
            setJsonResponse(data.questions);

            // Store in database
            if(data.questions){
                const resp=await db.insert(InterviewPrompt)
                .values({
                    mockID:mockID,
                    jsonMockResponse:JSON.stringify(data.questions),
                    jobRole:jobRole,
                    jobDesc:jobDesc,
                    quesType:quesType,
                    numOfQues:numOfQues,
                    conversationalMode:isConversationalMode,
                    supportingDoc:fileName,
                    createdBy:user?.primaryEmailAddress?.emailAddress,
                    createdAt:moment().format('DD-MM-yyyy')
                }).returning({mockID:InterviewPrompt.mockID})
                console.log("Inserted ID:", resp)
                if(resp){
                    setOpenPrompt(false);   // Close the prompt dialog
                    router.push('/dashboard/mockInterview/interviewSession/'+resp[0]?.mockID)
                }
            }else{
                console.log("Error storing data");
            }

        } catch (error) {
            console.error("Error generating questions & answers:", error);
        }
        setLoading(false);
    }

    const handleConversationalMode = async (checked) => {
        setIsConversationalMode(checked);
    }

    // const fileUpload = async(mockID) => {
    //     try{
    //         const fileExt = supportDoc.name.split(".").pop();
    //         const filePath = `${mockID}/${fileName}`;

    //         // // Get Clerk JWT Token for Supabase
    //         // const token = await getToken({ template: "supabase" });

    //         const { data, error } = await supabase.storage
    //         .from("mock-iv-sessions")
    //         .upload(filePath, supportDoc);

    //         if(error) {
    //             console.error("Error uploading file:", error);
    //             return;
    //         }

    //         const { data: url } = supabase.storage
    //         .from("mock-iv-sessions")
    //         .getPublicUrl(filePath);

    //         console.log(url.publicUrl);
    //         setFileURL(url.publicUrl);
    //     } catch (error) {
    //         console.log("Error uploading file:", error.message);
    //     }
        
    // }

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
                            <h2 className='italic'>Fields marked with <span className="text-red-500">*</span> are required.</h2>
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
                            <div className='my-3 flex justify-between'>
                                <div className='flex-1'>
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
                                <div className='flex-1'>
                                    <label className="text-black font-bold">Number of Questions</label>
                                    <Input className="bg-gray-100 p-2 rounded-md" placeholder="Default: 5"
                                    onChange={(event)=>setNumOfQues(event.target.value)}/>
                                </div>
                            </div>
                            <div className='flex item-center mt-5 my-3 gap-1'>
                                <Label className="text-black font-bold">Conversational Mode <span className="text-red-500">*</span></Label>
                                <TooltipProvider>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className='text-gray-400 w-4 h-4 cursor-pointer' />
                                    </TooltipTrigger>
                                    <TooltipContent className='bg-gray-500'>
                                        <p>Converse with a voice agent in an interactive interview setting.</p>
                                    </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Switch 
                                    checked={isConversationalMode} 
                                    onCheckedChange={handleConversationalMode}
                                    className='ml-5'
                                />
                            </div>
                            <div className='mb-3 mt-5'>
                                <label className="text-black font-bold">Supporting Document (Optional)</label>
                                <div className='text-xs mt-1 italic'>** PDF format ONLY</div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Input id="supportDoc" type="file" accept="application/pdf" className="bg-gray-100 p-2 rounded-md" 
                                    onChange={handleFileChange}/>
                                </div>
                            </div>
                        </div>
                        <div className='flex gap-5 justify-center'>
                            <Button type="button" variant="outline" onClick={()=>setOpenPrompt(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading?
                                <>
                                <LoaderCircle className='animate-spin'/>Generating questions..
                                </>:'Launch'
                                }
                            </Button>
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