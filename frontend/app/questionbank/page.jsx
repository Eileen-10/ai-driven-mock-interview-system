"use client"
import React, { useEffect, useState } from 'react'
import { db } from '@/utils/db';
import { useUser } from '@clerk/nextjs'
import { QuestionBank } from '@/utils/schema';
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

function QuestionBankPage() {
  const {user} = useUser()
  const [questionList, setQuestionList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')  // search text input
  const [quesTypeFilter, setQuesTypeFilter] = useState('allType') // ques type dropdown filter
  const [categoryFilter, setCategoryFilter] = useState('allCategory') // ques category dropdown filter
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 5
  const [openPrompt, setOpenPrompt] = useState(false) // New question input prompt
  const [loading, setLoading] = useState(false)
  const [newQues, setNewQues] = useState();   // new IV ques
  const [newQuesType, setNewQuesType] = useState('notsure');  // new ques type
  const [newQuesCategory, setNewQuesCategory] = useState('notsure');  // new ques category
  const [newJobRole, setNewJobRole] = useState('');  // new ques job role

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
        const predictionResp = await fetch("http://127.0.0.1:8000/predict-question-type", {
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
        const categoryResp = await fetch("http://127.0.0.1:8000/predict-question-category", {
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

  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Question Bank</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Search, filter, and explore questions to prepare for every interview scenario. 🔍</h2>
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
      </div>
      <div className='grid grid-cols-1 gap-5'>
        {currentPageQuestions && currentPageQuestions.map((question, index) =>(
            <QuestionItemCard 
            question={question}
            key={index}/>
        ))}
      </div>
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
    </div>
  )
}

export default QuestionBankPage