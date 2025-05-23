"use client"
import React, { useEffect, useState } from 'react'
import { db } from '@/utils/db';
import { useUser } from '@clerk/nextjs'
import { InterviewPrompt, QuestionBank } from '@/utils/schema';
import QuestionItemCard from '../dashboard/_components/QuestionItemCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Info, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import moment from 'moment'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation';

function QuestionBankPage() {
  const {user} = useUser()
  const router = useRouter()
  const [questionList, setQuestionList] = useState([])
  
  //Filter
  const [searchTerm, setSearchTerm] = useState('')  // search text input
  const [quesTypeFilter, setQuesTypeFilter] = useState('allType') // ques type dropdown filter
  const [categoryFilter, setCategoryFilter] = useState('allCategory') // ques category dropdown filter
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 5
  
  // Post New Ques
  const [openPrompt, setOpenPrompt] = useState(false) // New question input prompt
  const [loading, setLoading] = useState(false)
  const [newQues, setNewQues] = useState();   // new IV ques
  const [newQuesType, setNewQuesType] = useState('notsure');  // new ques type
  const [newQuesCategory, setNewQuesCategory] = useState('notsure');  // new ques category
  const [newJobRole, setNewJobRole] = useState('');  // new ques job role
  
  // New custom session
  const [selectedQuestions, setSelectedQuestions] = useState([]); // selected ques for custom session
  const [openSessionPrompt, setOpenSessionPrompt] = useState(false) // New custom session prompt
  const [jobRole, setJobRole] = useState("");  // Job Role/Position
  const [jobDesc, setJobDesc] = useState("");  // Job Description
  const [isConversationalMode, setIsConversationalMode] = useState(false) // IV mode
  const [sessionLoading, setSessionLoading] = useState(false)
  const [jsonResponse, setJsonResponse] = useState([]); // Selected ques & suggested ans pair

  useEffect(() => {
    user && getQuestionList()
  },[user])

  const getQuestionList = async() => {
    const quesList = await db.select()
    .from(QuestionBank)
    
    console.log(quesList)
    setQuestionList(quesList)
  }

  // Filtered questions (text search, quesType)
  const filteredQuestions = questionList.filter((question) => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = quesTypeFilter === 'allType' || quesTypeFilter === '' ? true : question.quesType === quesTypeFilter
    const matchesCategory = categoryFilter === 'allCategory' || categoryFilter === '' ? true : question.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage)
  const startIndex = (currentPage - 1) * questionsPerPage
  const endIndex = startIndex + questionsPerPage
  const currentPageQuestions = filteredQuestions.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, quesTypeFilter, categoryFilter])

  const onSubmit=async(e)=>{
    e.preventDefault()
    setLoading(true)

    try {
      let finalQuesType = newQuesType;
      let finalQuesCategory = newQuesCategory;

      // Predict question type if 'not sure'
      if (newQuesType === "notsure") {
        const predictionResp = await fetch("https://mockview-460317.as.r.appspot.com/predict-question-type", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: newQues }),
        });

        if (!predictionResp.ok) {
          throw new Error("Failed to predict question type");
        }

        const predictionData = await predictionResp.json();
        finalQuesType = predictionData.predicted_type;
      }

      // Predict question category if 'not sure'
      if (newQuesCategory === "notsure") {
        const categoryResp = await fetch("https://mockview-460317.as.r.appspot.com/predict-question-category", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: newQues }),
        });

        if (!categoryResp.ok) {
          throw new Error("Failed to predict question category");
        }

        const categoryData = await categoryResp.json();
        finalQuesCategory = categoryData.predicted_category;
      }

      // Insert new question into database
      const resp = await db.insert(QuestionBank)
      .values({
        question: newQues,
        quesType: finalQuesType,
        category: finalQuesCategory.toLowerCase(),
        jobRole: newJobRole,
        createdBy: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format('DD-MM-yyyy'),
      })
      .returning();
      if(resp){
          setOpenPrompt(false);   // Close the prompt dialog
          setNewQues("");
          setNewQuesType("notsure");
          setNewQuesCategory("notsure");
          setNewJobRole("");
          await getQuestionList(); // Refresh question list
      }
    } catch (error) {
      console.error("Failed to upload question:", error);
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  const handleConversationalMode = async (checked) => {
    setIsConversationalMode(checked);
  }
  
  const onSessionSubmit = async (e) => {
    e.preventDefault();
    setSessionLoading(true);

    const mockID = uuidv4(); 

    console.log(selectedQuestions)
    try {
      // Generate suggested answer for each ques
      const response = await fetch("http://localhost:8000/generate-suggested-answers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          questions: selectedQuestions,
          job_role: jobRole,
          job_desc: jobDesc,
        }),
      });
      const data = await response.json();
      setJsonResponse(data.suggested); // Ques & Ans pair
      // console.log("Selected Questions & Suggested Answers:", data.suggested);
      // console.log("Conversational Mode:", isConversationalMode);
      // console.log("Job Role:", jobRole.trim() || null);
      // console.log("Job Description:", jobDesc.trim() || null);
      // console.log("Number of Question:", selectedQuestions.length);
      
      // Save to InterviewPrompt db
      if(data.suggested){
          const resp=await db.insert(InterviewPrompt)
          .values({
              mockID:mockID,
              jsonMockResponse:JSON.stringify(data.suggested),
              jobRole:jobRole.trim() || null,
              jobDesc:jobDesc.trim() || null,
              numOfQues:selectedQuestions.length,
              conversationalMode:isConversationalMode,
              isCustom:true,
              createdBy:user?.primaryEmailAddress?.emailAddress,
              createdAt:moment().format('DD-MM-yyyy')
          }).returning({mockID:InterviewPrompt.mockID})
          console.log("Inserted ID:", resp)
          if(resp){
              setSelectedQuestions([]);
              setJobRole();
              setJobDesc();
              setOpenSessionPrompt(false);   // Close the prompt dialog
              router.push('/dashboard/mockInterview/interviewSession/'+resp[0]?.mockID)
          }
      }else{
          console.log("Error storing data");
      }

    } catch (error) {
      console.error("Failed to save session:", error);
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Question Bank</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Search, filter, and explore questions to prepare for every interview scenario. 🔍</h2>
      {/* == Filter == */}
      <div className='flex flex-col md:flex-row gap-4 my-5'>
        <Input
          placeholder='Search questions...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='md:w-1/2'
        />
        <Select onValueChange={(value) => setQuesTypeFilter(value)} value={quesTypeFilter}>
          <SelectTrigger className='md:w-1/2'>
            <SelectValue placeholder='Question Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='allType'>All Question Types</SelectItem>
            <SelectItem value='technical'>Technical</SelectItem>
            <SelectItem value='behavioral'>Behavioral</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setCategoryFilter(value)} value={categoryFilter}>
          <SelectTrigger className='md:w-1/2'>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='allCategory'>All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="engineering & it">Engineering & IT</SelectItem>
            <SelectItem value="business & finance">Business & Finance</SelectItem>
            <SelectItem value="public safety">Public Safety</SelectItem>
            <SelectItem value="customer service">Customer Service</SelectItem>
            <SelectItem value="education & literacy">Education & Literacy</SelectItem>
            <SelectItem value="social services">Social Services</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={()=>setOpenPrompt(true)}>+ New Question</Button>
        {selectedQuestions.length !== 0 && (<Button 
        className='bg-[#9C02CE] hover:bg-[#9C02CE]/80'
        onClick={()=>setOpenSessionPrompt(true)}>
          Generate Custom Session</Button>)}
      </div>
      {/* == Question Listing == */}
      <div className='grid grid-cols-1 gap-5'>
        {currentPageQuestions && currentPageQuestions.map((question, index) =>(
            <QuestionItemCard 
            question={question}
            key={index}
            isSelected={selectedQuestions.includes(question.question)}
            onSelect={(checked) => {
              if (checked) {
                setSelectedQuestions([...selectedQuestions, question.question]);
              } else {
                setSelectedQuestions(selectedQuestions.filter(q => q !== question.question));
              }
            }}
            />
        ))}
      </div>
      {/* == Pagination == */}
      {filteredQuestions.length > questionsPerPage && (
        <Pagination className='mt-6'>
          <PaginationContent>
            {/* Previous Button */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={`${
                  currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }`}
              />
            </PaginationItem>

            {/* Numbered Page Links */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
              })
              .reduce((acc, page, i, arr) => {
                if (i > 0 && page - arr[i - 1] > 1) {
                  acc.push('ellipsis')
                }
                acc.push(page)
                return acc
              }, [])
              .map((item, index) => (
                item === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={currentPage === item}
                      onClick={() => setCurrentPage(item)}
                      href="#"
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
            ))}

            {/* Next Button */}
            <PaginationItem>
              <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))
              }
              className={`${
                currentPage === totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }`}
            />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      {/* == Post New Ques Prompt == */}
      <Dialog open={openPrompt}>
          <DialogContent className="max-w-xl [&>button]:hidden">
              <DialogHeader>
                  <DialogTitle className='text-xl'>Fill in the details for new interview question</DialogTitle>
                  <DialogDescription>
                      <form onSubmit={onSubmit}>
                      <div>
                          <h2 className='italic'>Fields marked with <span className="text-red-500">*</span> are required.</h2>
                          <div className='mt-5 my-3'>
                              <label className="text-black font-bold">Question <span className="text-red-500">*</span></label>
                              <Textarea className="bg-gray-100 p-2 rounded-md" placeholder="e.g. Tell me about yourself" required
                              onChange={(event)=>setNewQues(event.target.value)}/>
                          </div>
                          <div className='my-3'>
                            <div className="flex items-center gap-1">
                              <label className="text-black font-bold">Type <span className="text-red-500">*</span></label>
                              <TooltipProvider>
                                  <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Info className='text-gray-400 w-4 h-4 cursor-pointer' />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className='bg-gray-500'>
                                      <p>System will auto categorise question type if 'Not Sure' is selected.</p>
                                  </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                            </div>
                              <Select value={newQuesType} onValueChange={(value) => setNewQuesType(value)} required>
                                  <SelectTrigger className="w-[200px] bg-gray-100 p-2 rounded-md">
                                      <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="behavioral">Behavioral</SelectItem>
                                      <SelectItem value="technical">Technical</SelectItem>
                                      <SelectItem value="notsure">Not Sure</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className='my-3'>
                            <div className="flex items-center gap-1">
                              <label className="text-black font-bold">Category <span className="text-red-500">*</span></label>
                              <TooltipProvider>
                                  <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Info className='text-gray-400 w-4 h-4 cursor-pointer' />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className='bg-gray-500'>
                                      <p>System will auto predict question category if 'Not Sure' is selected.</p>
                                  </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                            </div>
                              <Select value={newQuesCategory} onValueChange={(value) => setNewQuesCategory(value)} required>
                                  <SelectTrigger className="w-[300px] bg-gray-100 p-2 rounded-md">
                                      <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="general">General</SelectItem>
                                      <SelectItem value="healthcare">Healthcare</SelectItem>
                                      <SelectItem value="engineering & it">Engineering & IT</SelectItem>
                                      <SelectItem value="business & finance">Business & Finance</SelectItem>
                                      <SelectItem value="public safety">Public Safety</SelectItem>
                                      <SelectItem value="customer service">Customer Service</SelectItem>
                                      <SelectItem value="education & literacy">Education & Literacy</SelectItem>
                                      <SelectItem value="social services">Social Services</SelectItem>
                                      <SelectItem value="notsure">Not Sure</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className='my-3'>
                              <label className="text-black font-bold">Job Role/Position </label>
                              <Input className="bg-gray-100 p-2 rounded-md" placeholder="e.g. Full Stack Developer"
                                onChange={(event)=>setNewJobRole(event.target.value)}/>
                          </div>
                      </div>
                      <div className='flex gap-5 justify-center'>
                          <Button type="button" variant="outline" onClick={()=>setOpenPrompt(false)}>Cancel</Button>
                          <Button type="submit" disabled={loading}>
                              {loading?
                              <>
                              <LoaderCircle className='animate-spin'/>Saving questions..
                              </>:'Post'
                              }
                          </Button>
                      </div>
                      </form>
                  </DialogDescription>
              </DialogHeader>
          </DialogContent>
      </Dialog>
      {/* == Generate Custom Session Prompt == */}
      <Dialog open={openSessionPrompt}>
          <DialogContent className="max-w-xl [&>button]:hidden">
              <DialogHeader>
                  <DialogTitle className='text-xl'>Additional details for this interview session</DialogTitle>
                  <DialogDescription>
                      <form onSubmit={onSessionSubmit}>
                      <div>
                          <h2 className='italic'>Fields marked with <span className="text-red-500">*</span> are required.</h2>
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
                          <div className='mt-5 my-3'>
                              <label className="text-black font-bold">Job Role/Position </label>
                              <Input className="bg-gray-100 p-2 rounded-md" placeholder="e.g. Full Stack Developer"
                              onChange={(event)=>setJobRole(event.target.value)}/>
                          </div>
                          <div className='my-3'>
                              <label className="text-black font-bold">Job Scope/Description </label>
                              <Textarea className="bg-gray-100 p-2 rounded-md" placeholder="e.g. Frontend (React), Backend (Node.js), etc"
                              onChange={(event)=>setJobDesc(event.target.value)}/>
                          </div>
                          {/* Supporting Document */}
                          {/* <div className='mb-3 mt-5'>
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
                          </div> */}
                      </div>
                      <div className='flex gap-5 justify-center'>
                          <Button type="button" variant="outline" onClick={()=>setOpenSessionPrompt(false)}>Cancel</Button>
                          <Button type="submit" disabled={sessionLoading}>
                              {sessionLoading?
                              <>
                              <LoaderCircle className='animate-spin'/>Starting session..
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

export default QuestionBankPage