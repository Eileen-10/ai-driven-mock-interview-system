"use client"
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
import { UserButton, useUser } from '@clerk/nextjs'
import { ChartLine, MessagesSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

function Dashboard() {
  const {user} = useUser()
  const router = useRouter()
  const steps = [
    {
      title: "Access Interview",
      description: "Go to the Mock Interview page via the sidebar or click 'Start Interview' on top.",
    },
    {
      title: "Create Session",
      description: "Click '+ Create New' and fill in your desired interview scenario.",
    },
    {
      title: "Launch Interview",
      description: "Start the session after confirming every details entered.",
    },
    {
      title: "Setup Devices",
      description: "Allow access and select your mic and camera. You can also enable recording.",
    },
    {
      title: "Practice Live",
      description: "Engage in the mock interview with immersive AI-generated questions.",
    },
    {
      title: "Get Feedback",
      description: "Receive performance ratings and personalized feedback after the session.",
    },
  ];
  
  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Welcome, {user?.firstName}! ✨</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Get started by creating a new session or reviewing your performance insights to improve your interview skills.</h2>

      <div className='flex flex-row mt-5 gap-5'>
        <Card className='flex-1 relative bg-[#05060B] overflow-hidden rounded-2xl transition-all hover:scale-105 hover:shadow-md cursor-pointer' onClick = {() => router.replace('/dashboard/mockInterview')}>
          <div className='absolute inset-0 bg-[#F2465E]/20 duration-300 pointer-events-none z-0' />
          <CardContent className='relative z-10 mt-7 pb-7 px-9 text-white'>
            <MessagesSquare className='ml-2' />
            <h2 className='font-bold mt-4'>Start Interview</h2>
            <h2 className='text-xs mt-1'>Join a Mock Interview Session</h2>
          </CardContent>
        </Card>
        <Card className='flex-1 relative bg-[#05060B] overflow-hidden rounded-2xl transition-all hover:scale-105 hover:shadow-md cursor-pointer' onClick = {() => router.replace('/dashboard/analytics')}>
          <div className='absolute inset-0 bg-[#9C02CE]/20 duration-300 pointer-events-none z-0' />
          <CardContent className='relative z-10 mt-7 pb-7 px-9 text-white'>
            <ChartLine className='ml-2' />
            <h2 className='font-bold mt-4'>Go to Analytic Dashboard</h2>
            <h2 className='text-xs mt-1'>Review past performances</h2>
          </CardContent>
        </Card>
      </div>
      <Separator className='my-5'/>
      <h2 className='font-bold text-lg mb-3'>How To Get Started?</h2>
      <div className="w-full flex justify-center px-4">
        <Carousel className="w-full max-w-5xl mt-5">
          <div className="flex items-center gap-2">
            <CarouselPrevious className="static relative left-0 z-10" />

            <CarouselContent className="-ml-4">
              {steps.map((step, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="bg-gray-50 border shadow-sm hover:shadow-md transition-all duration-300 h-full">
                      <CardContent className="p-6 h-full flex flex-col justify-center text-center">
                        <h2 className="text-xs mb-2 text-[#05060B]">Step {index + 1}: </h2>
                        <h2 className="text-lg font-bold mb-2 text-[#05060B]">{step.title}</h2>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselNext className="static relative right-0 z-10" />
          </div>
        </Carousel>
      </div>
    </div>
  )
}

export default Dashboard