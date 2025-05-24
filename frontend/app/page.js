"use client"
import { Button } from '@/components/ui/button'
import { MoveUpRight } from 'lucide-react'
import React from 'react'
import Header from './_components/Header'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function Home() {
  const router = useRouter()
  const steps = [
    {
      title: "Navigate to Mock Interview",
      description: "Head over to the Mock Interview page via the navigation bar or click on “Explore” to begin your journey.",
    },
    {
      title: "Create a New Session",
      description: "Click “+ Create New” and customise your desired interview scenario.",
    },
    {
      title: "Launch Interview",
      description: "Start the session after confirming every details entered.",
    },
    {
      title: "Setup Devices",
      description: "Grant access and select your mic and camera. Optionally enable screen recording for a more immersive review.",
    },
    {
      title: "Practice Live",
      description: "Engage in the mock interview with immersive AI-generated questions.",
    },
    {
      title: "Receive Smart Feedback",
      description: "Get instant and personalised feedback after each session.",
    },
    {
      title: "Review & Track Progress",
      description: "Access your past sessions, view analytics, and measure growth over time from your personalised dashboard.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header/>
      <div className="flex flex-grow h-[calc(100vh-60px)]">
        <div className='flex-grow shadow-lg overflow-auto' style={{ marginLeft: '20px', marginRight: '20px', marginTop: '6px', marginBottom: '20px' }}>
          <div className="flex flex-col">
            <section className="text-white px-6 md:px-16 py-20">
              <div className="text-left max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Ace your interview,
                </h1>
                <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F2465E] via-[#FF8C00] to-[#40E0D0]">
                  Anytime, Anywhere
                </span>
                <p className="mt-6 text-white">
                  Elevate your interview skills with tailored AI-driven feedback.
                </p>
                <Button 
                onClick = {() => router.replace('/dashboard/home')}
                className="mt-8 text-base bg-white text-black px-6 py-5 rounded-full font-bold hover:ring-4 hover:ring-offset-2 hover:ring-transparent 
                  hover:bg-gray-100 transition relative 
                  hover:shadow-[0_0_10px_3px_rgba(242,70,94,0.7),0_0_20px_6px_rgba(255,140,0,0.5),0_0_30px_9px_rgba(64,224,208,0.4)]">
                  Explore <MoveUpRight />
                </Button>
              </div>
            </section>
          
            {/* How It Works */}
            <section className="bg-white text-black px-6 md:px-16 py-12 rounded-tl-[4rem]">
              <h2 className="text-2xl font-bold text-center mb-7">How It Works</h2>
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
                                <h2 className="text-xs mb-2 text-[#05060B]">Step {index + 1}:</h2>
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
            </section>
          
            {/* Benefits */}
            <section className="text-white px-6 md:px-16 py-20 pt-15">
              <h2 className="text-2xl font-bold text-left mb-12">Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className='relative bg-[#05060B] overflow-hidden rounded-2xl transition-all hover:scale-105 hover:shadow-md border-none'>
                  <div className='absolute inset-0 bg-[#F2465E]/30 duration-300 pointer-events-none z-0' />
                  <CardContent className='relative z-10 mt-7 pb-7 px-9 text-white'>
                    <h2 className='ml-2 text-3xl'>🎯</h2>
                    <h2 className='font-bold mt-4'>Role-Specific Questioning</h2>
                    <h2 className='text-xs mt-1'>Practice with questions tailored to specific job roles and industries for a highly relevant experience.</h2>
                  </CardContent>
                </Card>
                <Card className='relative bg-[#05060B] overflow-hidden rounded-2xl transition-all hover:scale-105 hover:shadow-md border-none'>
                  <div className='absolute inset-0 bg-[#9C02CE]/30 duration-300 pointer-events-none z-0' />
                  <CardContent className='relative z-10 mt-7 pb-7 px-9 text-white'>
                    <h2 className='ml-2 text-3xl'>🧠</h2>
                    <h2 className='font-bold mt-4'>Personalised AI Feedback</h2>
                    <h2 className='text-xs mt-1'>Receive targeted insights and improvement suggestions based on your answers and keyword usage.</h2>
                  </CardContent>
                </Card>
                <Card className="relative bg-[#05060B] overflow-hidden rounded-2xl transition-all hover:scale-105 hover:shadow-md border-none">
                  <div className="absolute inset-0 bg-[#FF8C00]/30 duration-300 pointer-events-none z-0" />
                  <CardContent className="relative z-10 mt-7 pb-7 px-9 text-white">
                    <h2 className="text-3xl">📊</h2>
                    <h2 className="font-bold mt-4">Performance Analytics</h2>
                    <h2 className="text-xs mt-1">
                      View visual breakdowns of your strengths and weaknesses over past sessions.
                    </h2>
                  </CardContent>
                </Card>
                <Card className="relative bg-[#05060B] overflow-hidden rounded-2xl transition-all hover:scale-105 hover:shadow-md border-none">
                  <div className="absolute inset-0 bg-[#40E0D0]/30 duration-300 pointer-events-none z-0" />
                  <CardContent className="relative z-10 mt-7 pb-7 px-9 text-white">
                    <h2 className="text-3xl">🕒</h2>
                    <h2 className="font-bold mt-4">Practice Anytime, Anywhere</h2>
                    <h2 className="text-xs mt-1">
                      No scheduling required! Get instant access to interviews 24/7 from any device.
                    </h2>
                  </CardContent>
                </Card>
              </div>
            </section>
          
            {/* FAQs */}
            <section className="bg-white text-black px-6 md:px-16 py-12">
              <h2 className="text-2xl font-bold text-left mb-5">FAQs</h2>
              <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto space-y-4">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is MockView?</AccordionTrigger>
                  <AccordionContent>
                    MockView is an AI-driven mock interview system that simulates realistic interview scenarios and provides smart feedback to help you improve.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Is it free to use?</AccordionTrigger>
                  <AccordionContent>
                    Yes! You can access the core features for free. Premium features may be available in future versions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Do I need a webcam and microphone?</AccordionTrigger>
                  <AccordionContent>
                    Yes, only microphone access is compulsory. But to get the most out of your mock interview experience, we recommend using a webcam and mic.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I practice interviews for specific job roles?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely! You can customise your desired role, job scope, question type and interview mode when creating a session.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>How does the AI generate feedback?</AccordionTrigger>
                  <AccordionContent>
                    Our system uses natural language processing (NLP) and large language model (LLM) to analyse your answers and generate feedback on clarity, confidence, and content.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>Is my data and recording secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes. All your sessions and recordings are securely stored and only accessible by you.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          
            {/* Info */}
            <section className="text-white px-6 md:px-16 py-10 mt-10">
              <div className="flex flex-col gap-4">
                
                {/* Top Row: Logo, GitHub, Email */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  {/* Logo */}
                  <div className="flex items-center gap-3">
                    <Image src="/logo.svg" width={40} height={40} alt="logo" />
                    <h2 className="font-black text-lg">MockView</h2>
                  </div>

                  {/* Links */}
                  <div className="flex gap-6 items-center text-sm">
                    {/* GitHub */}
                    <a
                      href="https://github.com/Eileen-10/ai-driven-mock-interview-system"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Image src="/github.svg" width={25} height={25} alt="GitHub" />
                      <span>GitHub Repository</span>
                    </a>

                    {/* Email */}
                    <a
                      href="mailto:mockview.dev@gmail.com"
                      className="flex items-center gap-2 hover:underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-white" viewBox="0 0 24 24">
                        <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2v.511l-8 5.334-8-5.334V6h16zM4 18V8.489l7.445 4.964a1 1 0 001.11 0L20 8.489V18H4z" />
                      </svg>
                      <span>mockview.dev@gmail.com</span>
                    </a>
                  </div>
                </div>

                {/* Bottom Row: Attribution */}
                <div className="text-sm text-gray-400 text-center md:text-right">
                  © {new Date().getFullYear()} Teng Eileen — Final Year Project · USM
                </div>
              </div>
            </section>
          </div>
        </div> 
      </div>
    </div>
  );
}
