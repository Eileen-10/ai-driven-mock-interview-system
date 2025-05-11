"use client"
import { Button } from '@/components/ui/button'
import { UserButton, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

function Header() {

    const path = usePathname();
    const router = useRouter();
    const { isSignedIn } = useUser();

  return (
    <div className='flex h-[60px] px-4 items-center justify-between text-white'>
        <div className='flex gap-3 items-center'>
            <Image src={'/logo.svg'} width={40} height={40} alt='logo' />
            <h2 className='font-black'>MockView</h2>
        </div>
        <ul className='text-sm hidden md:flex gap-12'>
            <li onClick={() => router.push('/')}
                className={`hover:font-bold transition-all cursor-pointer
                ${path=='/' && 'font-bold'}`} style={{textShadow: path === '/' ? '0 10px 5px rgba(255, 140, 0, 0.3)' : 'none',}}>About</li>
            <li onClick={() => router.push('/dashboard/home')}
                className={`hover:font-bold transition-all cursor-pointer
                ${path.startsWith('/dashboard') && 'font-bold'}`} style={{textShadow: path.startsWith('/dashboard') ? '0 10px 5px rgba(255, 140, 0, 0.3)' : 'none',}}>Mock Interview</li>
            <li onClick={() => router.push('/questionbank')}
                className={`hover:font-bold transition-all cursor-pointer
                ${path=='/questionbank' && 'font-bold'}`} style={{textShadow: path === '/questionbank' ? '0 10px 5px rgba(255, 140, 0, 0.3)' : 'none',}}>Question Bank</li>
        </ul>
        {/* Auth Buttons */}
        <div className="flex gap-4 items-center">
            {isSignedIn ? (
            <UserButton />
            ) : (
            <>
                <button
                className="text-sm font-medium hover:underline"
                onClick={() => router.push("/sign-in")}
                >
                Log In
                </button>
                <Button
                variant="default"
                className="text-sm font-semibold px-5 py-2 rounded-md bg-white text-black hover:bg-[#F2465E] hover:text-white"
                onClick={() => router.push("/sign-up")}>
                Sign Up
                </Button>
            </>
            )}
        </div>
    </div>
  )
}

export default Header