"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/db'
import { eq } from 'drizzle-orm'
import { InterviewPrompt, SessionFeedback } from '@/utils/schema'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

function analytics() {

  const {user} = useUser()
  const [pastInterviewList, setPastInterviewList] = useState([])
  const [sessionFeedbackData, setSessionFeedbackData] = useState()

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

  const chartData = sessionFeedbackData?.length
  ? sessionFeedbackData.map((session, index) => ({
      session: `Session ${index + 1}`,
      overallRating: session.overallRating,
    }))
  : []

  const chartConfig = {
    overallRating: {
      label: "Overall Rating",
      color: "hsl(var(--chart-1))",
    },
  }
  

  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Analytic Dashboard</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Track your interview performances and improve over time! 💯</h2>

      <div className='flex mt-5'>
        <Card>
          <CardContent className='mt-5'>
            <h2 className='text-xs text-gray-500'>Total Completed Session</h2>
            <h2 className='font-bold text-4xl mt-2'>{pastInterviewList?.length}</h2>
          </CardContent>
        </Card>
      </div>
      {/* Overall Rating Trend Chart */}
      <div>
        <Card className='mt-6 max-w-md'>
          <CardHeader>
            <CardTitle>Overall Rating Trend</CardTitle>
            <CardDescription>Visualizing the trend of overall ratings across sessions.</CardDescription>
          </CardHeader>
          <CardContent className='p-0 pr-5'>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <AreaChart
                data={chartData}
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
                  domain={[0, 10]} // Assuming ratings are out of 10
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="overallRating"
                  type="natural"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.4}
                  stroke="hsl(var(--chart-1))"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm mt-2">
              <div className="grid gap-2">
                <div className="flex text-xs items-center gap-2 font-medium leading-none">
                  <TrendingUp className="h-4 w-4" />Your interview performance has by % over the last {pastInterviewList?.length} sessions.
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default analytics