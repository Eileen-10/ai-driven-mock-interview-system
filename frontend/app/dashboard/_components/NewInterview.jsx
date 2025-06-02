"use client"
import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
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

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
)

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
    const [isConversationalMode, setIsConversationalMode] = useState(false) // IV mode
    const [docMode, setDocMode] = useState(null); // supportDoc: Select existing/ Upload new/ None
    const [fileList, setFileList] = useState([]); // Uploaded supportDocs list from supabase
    const [selectedDocId, setSelectedDocId] = useState(null); // Selected doc from uploaded doc list
    const [saveToSupportDocsCenter, setSaveToSupportDocsCenter] = useState(false); // Option to save to supabase if upload new doc

    const handleFileChange = (event) => {
        setSupportDoc(event.target.files[0]); // Set the actual file
    };

    const onSubmit=async(e)=>{
        setLoading(true)
        e.preventDefault()

        const mockID = uuidv4();  
        
        const formData = new FormData();
        formData.append("job_role", jobRole);
        formData.append("job_desc", jobDesc);
        formData.append("ques_type", quesType);
        formData.append("num_ques", numOfQues);
        try {
            let file = null;
            let fileUrl = null;
            
            // If user selected existing document from dropdown
            if (docMode === 'existing' && selectedDocId) {
                const selectedFile = fileList.find(file => file.id === selectedDocId);
                if (selectedFile) {
                    const response = await fetch(selectedFile.url);
                    const blob = await response.blob();
                    file = new File([blob], selectedFile.name, { type: 'application/pdf' });
                    setSupportDoc(file); // update local state if needed
                    formData.append("support_doc", file);
                    fileUrl = selectedFile.url;
                }
            }

            // If user uploaded a new file
            let uploadedUrl = null;
            if (docMode === 'upload' && supportDoc) {
                formData.append("support_doc", supportDoc);

                // Upload to Supabase if requested
                if (saveToSupportDocsCenter) {
                    uploadedUrl = await fileUpload(mockID)
                    if (!uploadedUrl) {
                        setLoading(false); // Prevent session start if upload failed
                        return;
                    }
                    setFileURL(uploadedUrl);
                    fileUrl = uploadedUrl;
                }
            }

            console.log(jobRole, jobDesc, quesType, supportDoc)

            // Call for OCR & LLM from FastAPI
            // To generate Interview Questions & Suggested Answers
            const response = await fetch("https://ai-driven-mock-interview-system.onrender.com/generate-question", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Generated Questions & Suggested Answers:", data.questions);
            setJsonResponse(data.questions);

            let supportingDocName = null;
            if (docMode === 'existing' && selectedDocId) {
                supportingDocName = file?.name; // file is defined in your fetch block
            } else if (docMode === 'upload' && supportDoc) {
                supportingDocName = supportDoc.name;
            }

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
                    supportingDoc:supportingDocName,
                    supportingDocURL:fileUrl,
                    isCustom:false,
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

    useEffect(() => {
        const fetchUserFiles = async () => {
            if (!user) return;

            const { data, error } = await supabase
            .from('supportDocs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

            if (error) {
            console.error('Error fetching metadata:', error);
            return;
            }

            const filesWithUrls = data.map(file => ({
            id: file.id.toString(),
            name: file.file_name,
            url: file.public_url,
            updatedAt: new Date(file.created_at).toLocaleString(),
            isDefault: file.is_default
            }));

            setFileList(filesWithUrls);
            const defaultDoc = filesWithUrls.find(f => f.isDefault);
            if (defaultDoc) {
            setSelectedDocId(defaultDoc.id);
            }
        };

        if (docMode === 'existing') {
            fetchUserFiles();
        }
    }, [docMode, user]);

    useEffect(() => {
        if (docMode === null) {
            setSupportDoc(null);
            setSelectedDocId(null);
        }
    }, [docMode]);

    const fileUpload = async (mockID) => {
        try {
            if (!supportDoc || !user) return null;

            const originalFileName = supportDoc.name;
            const fileExt = supportDoc.name.split('.').pop();

            // 1. Check for existing file with same name
            const { data: existingFiles, error: checkError } = await supabase
            .from('supportDocs')
            .select('*')
            .eq('user_id', user.id)
            .eq('file_name', originalFileName);

            if (checkError) {
            console.error("Error checking for existing file:", checkError);
            return null;
            }

            if (existingFiles.length > 0) {
            alert("You have already uploaded a file with the same name. Please rename the file or choose another if you want to save it into existing list.");
            return null;
            }

            // 2. Check if user already has a default file
            const { data: defaultCheck } = await supabase
            .from("supportDocs")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_default", true);

            const isDefault = defaultCheck.length === 0;

            // 3. Create unique file name and path
            const uniqueSuffix = Date.now();
            const uniqueFileName = `${uniqueSuffix}.${fileExt}`;
            const filePath = `support_docs/${user.id}/${uniqueFileName}`;

            const { error: uploadError } = await supabase.storage
            .from("mock-iv-sessions")
            .upload(filePath, supportDoc, {
                cacheControl: "3600",
                upsert: false,
            });

            if (uploadError) {
            console.error("Upload error:", uploadError);
            return null;
            }

            const { data: { publicUrl } } = supabase
            .storage
            .from("mock-iv-sessions")
            .getPublicUrl(filePath);

            // 4. Insert metadata into supportDocs table
            const { error: dbError } = await supabase
            .from("supportDocs")
            .insert([{
                user_id: user.id,
                file_name: originalFileName,
                file_path: filePath,
                public_url: publicUrl,
                is_default: isDefault,
            }]);

            if (dbError) {
            console.error("Error inserting into supportDocs:", dbError);
            return null;
            }

            return publicUrl;

        } catch (error) {
            console.error("Error in fileUpload:", error.message);
            return null;
        }
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
                            <div className='flex items-center mt-5 my-3 gap-1'>
                                <Label className="text-black font-bold">Interview Mode <span className="text-red-500">*</span></Label>
                                <TooltipProvider>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className='text-gray-400 w-4 h-4 cursor-pointer' />
                                    </TooltipTrigger>
                                    <TooltipContent className='bg-gray-500'>
                                        <p>Converse with a voice agent in an interactive interview setting with Conversational Mode.</p>
                                    </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Switch 
                                    checked={isConversationalMode} 
                                    onCheckedChange={handleConversationalMode}
                                    className='ml-5'
                                />
                                <Label className="text-black ml-3">{isConversationalMode ? "Conversational Mode" : "Default Mode"}</Label>
                            </div>
                            <div className='mb-3 mt-5'>
                                <label className="text-black font-bold">Supporting Document (Optional)</label>
                                <div className='text-xs mt-1 italic'>e.g. Resume, CV, Cover Letter, ..</div>
                                <div className='text-xs mt-1 italic'>** PDF format ONLY</div>
                                <div className='flex gap-3 mt-2'>
                                    <Button
                                        type="button"
                                        onClick={() => setDocMode(prev => prev === 'existing' ? null : 'existing')}
                                        className={`border ${docMode === 'existing' ? 'bg-black text-white hover:bg-black' : 'bg-white text-black hover:bg-gray-600 hover:text-white'}`}
                                    >
                                        Select from existing document
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setDocMode(prev => prev === 'upload' ? null : 'upload')}
                                        className={`border ${docMode === 'upload' ? 'bg-black text-white hover:bg-black' : 'bg-white text-black hover:bg-gray-600 hover:text-white'}`}
                                    >
                                        Upload new document
                                    </Button>
                                </div>
                                {docMode === 'existing' && (
                                    <div className="my-2">
                                    {fileList.length > 0 ? (
                                        <Select
                                        value={selectedDocId || ''}
                                        onValueChange={(val) => setSelectedDocId(val)}
                                        >
                                        <SelectTrigger className="w-full bg-gray-100 p-2 rounded-md">
                                            <SelectValue placeholder="Choose a document" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fileList.map((file) => (
                                            <SelectItem key={file.id} value={file.id}>
                                                {file.name} {file.isDefault ? '(Default)' : ''}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic mt-2">No documents found.</p>
                                    )}
                                    </div>
                                )}
                                {docMode === 'upload' && (
                                    <div className="grid w-full max-w-sm items-center gap-1.5 my-2">
                                        <Input id="supportDoc" type="file" accept="application/pdf" className="bg-gray-100 p-2 rounded-md" 
                                        onChange={handleFileChange}/>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Switch id="saveToCenter" checked={saveToSupportDocsCenter} onCheckedChange={setSaveToSupportDocsCenter} />
                                            <Label htmlFor="saveToCenter" className="text-sm">Save to existing document list</Label>
                                        </div>
                                    </div>
                                )}
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