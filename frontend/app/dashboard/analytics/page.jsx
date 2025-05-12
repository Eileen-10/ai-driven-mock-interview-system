"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/db'
import { eq } from 'drizzle-orm'
import { InterviewPrompt, SessionFeedback } from '@/utils/schema'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, PolarAngleAxis, PolarGrid, Radar, RadarChart, Bar, BarChart, Legend} from "recharts"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

function analytics() {

  const {user} = useUser()
  const [pastInterviewList, setPastInterviewList] = useState([])
  const [sessionFeedbackData, setSessionFeedbackData] = useState()
  const totalQuestionsPracticed = pastInterviewList?.reduce((sum, session) => sum + session.numOfQues, 0) || 0
  const router = useRouter()

  useEffect(() => {
    if (user) {
      getPastInterviewList()
      getSessionFeedback()
    } 
  },[user])

  const getPastInterviewList = async() => {
    const interviewList = await db.select()
    .from(InterviewPrompt)
    .where(eq(InterviewPrompt.createdBy, user?.primaryEmailAddress?.emailAddress))
    
    console.log(interviewList)
    setPastInterviewList(interviewList)
  }

  const getSessionFeedback = async() => {
    const sessionFeedback = await db.select()
    .from(SessionFeedback)
    .where(eq(SessionFeedback.createdBy, user?.primaryEmailAddress?.emailAddress))
  
    console.log(sessionFeedback)
    setSessionFeedbackData(sessionFeedback)

  }

  const getSkillStrengths = (sessionFeedbackData) => {
    if (!sessionFeedbackData || sessionFeedbackData.length === 0) return { strongestSkill: "N/A", weakestSkill: "N/A" };
  
    // Calculate average ratings
    const skillCategories = {
      "Problem Solving": sessionFeedbackData.reduce((sum, session) => sum + session.probSolRating, 0) / sessionFeedbackData.length,
      "Communication": sessionFeedbackData.reduce((sum, session) => sum + session.commRating, 0) / sessionFeedbackData.length,
      "Technical Knowledge": sessionFeedbackData.reduce((sum, session) => sum + session.techRating, 0) / sessionFeedbackData.length,
      "Confidence & Clarity": sessionFeedbackData.reduce((sum, session) => sum + session.confRating, 0) / sessionFeedbackData.length,
    };
  
    // Determine the strongest and weakest skill
    const strongestSkill = Object.keys(skillCategories).reduce((a, b) => skillCategories[a] > skillCategories[b] ? a : b);
    const weakestSkill = Object.keys(skillCategories).reduce((a, b) => skillCategories[a] < skillCategories[b] ? a : b);
  
    return { strongestSkill, weakestSkill };
  }
  const { strongestSkill, weakestSkill } = getSkillStrengths(sessionFeedbackData);

  const chartData_overallRating = sessionFeedbackData?.length
  ? sessionFeedbackData.map((session, index) => ({
      session: `Session ${index + 1}`,
      overallRating: session.overallRating,
    }))
  : []

  const chartConfig_overallRating = {
    overallRating: {
      label: "Overall Rating",
      color: "var(--chart-1)",
    },
  }

  const chartData_avgSkillRating = (sessionFeedbackData) => {
    if (!sessionFeedbackData || sessionFeedbackData.length === 0) return [];
  
    // Aggregate data by averaging skill ratings across all sessions
    return [
      {
        skill: "Problem Solving",
        value: sessionFeedbackData.reduce((sum, session) => sum + session.probSolRating, 0) / sessionFeedbackData.length,
      },
      {
        skill: "Communication",
        value: sessionFeedbackData.reduce((sum, session) => sum + session.commRating, 0) / sessionFeedbackData.length,
      },
      {
        skill: "Technical Knowledge",
        value: sessionFeedbackData.reduce((sum, session) => sum + session.techRating, 0) / sessionFeedbackData.length,
      },
      {
        skill: "Confidence & Clarity",
        value: sessionFeedbackData.reduce((sum, session) => sum + session.confRating, 0) / sessionFeedbackData.length,
      }
    ];
  }
  
  const chartConfig_avgSkillRating = {
    problemSolving: { label: "Problem Solving", color: "var(--chart-1)" },
    communication: { label: "Communication", color: "var(--chart-2)" },
    technicalKnowledge: { label: "Technical Knowledge", color: "var(--chart-3)" },
    confidence: { label: "Confidence & Clarity", color: "var(--chart-4)" },
  }

  const chartData_quesType = pastInterviewList?.length
  ? [
      {
        quesType: "Behavioural",
        value: pastInterviewList.filter(session => session.quesType === "behavioural").length,
      },
      {
        quesType: "Technical",
        value: pastInterviewList.filter(session => session.quesType === "technical").length,
      },
      {
        quesType: "Combination",
        value: pastInterviewList.filter(session => session.quesType === "combination").length,
      },
    ]
  : [];

  const chartConfig_quesType = {
    Behavioural: { label: "Behavioural" },
    Technical: { label: "Technical" },
    Combination: { label: "Combination" },
  }

  const chartData_skillRating = (sessionFeedbackData) => {
    if (!sessionFeedbackData || sessionFeedbackData.length === 0) return [];
  
    // Create the chart data for each session
    return sessionFeedbackData.map((session, index) => ({
      session: `Session ${index + 1}`,
      problemSolving: session.probSolRating,
      communication: session.commRating,
      technicalKnowledge: session.techRating,
      confidence: session.confRating,
    }));
  }

  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Analytic Dashboard</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Track your interview performances and improve over time! 💯</h2>

      <div className='flex flex-row mt-5 gap-5'>
        <Card className='flex-1 bg-gray-50'>
          <CardContent className='mt-5'>
            <h2 className='text-xs'>Total Completed Sessions</h2>
            <h2 className='font-bold text-4xl mt-2'>{pastInterviewList?.length}</h2>
          </CardContent>
        </Card>
        <Card className='flex-1 bg-gray-50'>
          <CardContent className='mt-5'>
            <h2 className='text-xs'>Total Questions Practiced</h2>
            <h2 className='font-bold text-4xl mt-2'>{totalQuestionsPracticed}</h2>
          </CardContent>
        </Card>
        <Card className='flex-1 bg-gray-50'>
          <CardContent className='mt-5'>
            <h2 className='text-xs'>Strongest Skill Category</h2>
            <h2 className='font-bold text-lg mt-2'>{strongestSkill}</h2>
          </CardContent>
        </Card>
        <Card className='flex-1 bg-gray-50'>
          <CardContent className='mt-5'>
            <h2 className='text-xs'>Weakest Skill Category</h2>
            <h2 className='font-bold text-lg mt-2'>{weakestSkill}</h2>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-row mt-5 gap-5'>
        {/* Overall Rating Trend Area Chart */}
        <Card className='flex-1 bg-gray-50 flex flex-col'>
          <CardHeader>
            <CardTitle className='font-bold'>Session Performance Trend</CardTitle>
            <CardDescription>Tracking your overall interview performance across sessions.</CardDescription>
          </CardHeader>
          <CardContent className='p-0 pr-5 flex-grow'>
            <ChartContainer config={chartConfig_overallRating} className="min-h-[200px] w-full">
              <AreaChart
                data={chartData_overallRating}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="session"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 10]}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="overallRating"
                  type="natural"
                  fill="var(--chart-1)"
                  fillOpacity={0.4}
                  stroke="var(--chart-1)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Skill Rating Radar Chart */}
        <Card className="flex-1 bg-gray-50 flex flex-col">
          <CardHeader>
            <CardTitle className="font-bold">Average Skill Proficiency</CardTitle>
            <CardDescription>Analyzing your strengths and weaknesses based on average ratings from all sessions.</CardDescription>
          </CardHeader>
          <CardContent className='p-0 pl-6 flex-grow'>
            <ChartContainer config={chartConfig_avgSkillRating}>
              <RadarChart data={chartData_avgSkillRating(sessionFeedbackData)}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarGrid gridType="circle" />
                <PolarAngleAxis dataKey="skill" />
                <Radar
                  dataKey="value"
                  fill="var(--chart-4)"
                  fillOpacity={0.6}
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={{ r: 4, fillOpacity: 1 }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-row mt-5 gap-5'>
        {/* Session Type Distribution Bar Chart */}
        <Card className="flex-1 bg-gray-50 flex flex-col">
          <CardHeader>
            <CardTitle className="font-bold">Session Type Distribution</CardTitle>
            <CardDescription>Visualizing distribution of question type you have practiced on.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pr-1 pb-1 flex-grow">
            <ChartContainer config={chartConfig_quesType}>
              <BarChart data={chartData_quesType} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="quesType" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Skill Rating per Session Area Chart */}
        <Card className="flex-1 bg-gray-50 flex flex-col">
          <CardHeader>
            <CardTitle className='font-bold'>Skill Ratings Over Sessions</CardTitle>
            <CardDescription>
              Stacked visualization of each skill categories' rating over multiple sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <ChartContainer config={chartConfig_avgSkillRating}>
              <AreaChart
                accessibilityLayer
                data={chartData_skillRating(sessionFeedbackData)}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="session"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillProblemSolving" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillCommunication" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillTechnicalKnowledge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="problemSolving"
                  type="monotone"
                  fill="url(#fillProblemSolving)"
                  stroke="var(--chart-4)"
                  stackId="a"
                />
                <Area
                  dataKey="communication"
                  type="monotone"
                  fill="url(#fillCommunication)"
                  stroke="var(--chart-1)"
                  stackId="a"
                />
                <Area
                  dataKey="technicalKnowledge"
                  type="monotone"
                  fill="url(#fillTechnicalKnowledge)"
                  stroke="var(--chart-2)"
                  stackId="a"
                />
                <Area
                  dataKey="confidence"
                  type="monotone"
                  fill="url(#fillConfidence)"
                  stroke="var(--chart-3)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-col justify-center mt-8 gap-2'>
        <h2 className='text-center text-xs italic'>Consistency is key and every session is a step closer to success!</h2>
        <Button className='rounded-full self-center p-5 hover:scale-105 hover:shadow-md transition-all' onClick = {() => router.replace('/dashboard/mockInterview')}>Practice Now</Button>
      </div>

    </div>
  )
}

export default analytics