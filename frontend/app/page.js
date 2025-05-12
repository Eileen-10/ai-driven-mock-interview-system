import { Button } from '@/components/ui/button'
import { MoveUpRight } from 'lucide-react'
import React from 'react'
import Header from './_components/Header';

export default function Home() {
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
                <Button className="mt-8 text-base bg-white text-black px-6 py-5 rounded-full font-bold hover:ring-4 hover:ring-offset-2 hover:ring-transparent 
                  hover:bg-gray-100 transition relative 
                  hover:shadow-[0_0_10px_3px_rgba(242,70,94,0.7),0_0_20px_6px_rgba(255,140,0,0.5),0_0_30px_9px_rgba(64,224,208,0.4)]">
                  Explore <MoveUpRight />
                </Button>
              </div>
            </section>
          
            {/* How It Works */}
            <section className="bg-white text-black px-6 md:px-16 py-12 rounded-tl-[4rem]">
              <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-200 h-64 rounded-2xl" />
                <div className="bg-gray-200 h-64 rounded-2xl" />
                <div className="bg-gray-200 h-64 rounded-2xl" />
              </div>
            </section>
          
            {/* Benefits */}
            <section className="text-white px-6 md:px-16 py-20">
              <h2 className="text-2xl font-bold text-left mb-12">Benefits</h2>
            </section>
          
            {/* FAQs */}
            <section className="bg-white text-black px-6 md:px-16 py-12">
              <h2 className="text-2xl font-bold text-left mb-12">FAQs</h2>
            </section>
          
            {/* Info */}
            <section className="text-white px-6 md:px-16 py-20">
              
            </section>
          </div>
        </div> 
      </div>
    </div>
  );
}
