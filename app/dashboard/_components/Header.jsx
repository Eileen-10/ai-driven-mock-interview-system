"use client"
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'

function Header() {

    const path=usePathname();
    useEffect(()=>{
        
    },[])

  return (
    <div className='flex p-4 items-center justify-between text-white'>
        <div className='flex gap-3 items-center'>
            <Image src={'/logo.svg'} width={40} height={40} alt='logo' />
            <h2 className='font-black'>MockView</h2>
        </div>
        <ul className='text-sm hidden md:flex gap-12'>
            <li className={`hover:font-bold transition-all cursor-pointer
                ${path=='/about' && 'font-bold'}`} style={{textShadow: path === '/about' ? '0 10px 5px rgba(255, 140, 0, 0.3)' : 'none',}}>About</li>
            <li className={`hover:font-bold transition-all cursor-pointer
                ${path=='/dashboard' && 'font-bold'}`} style={{textShadow: path === '/dashboard' ? '0 10px 5px rgba(255, 140, 0, 0.3)' : 'none',}}>Mock Interview</li>
            <li className={`hover:font-bold transition-all cursor-pointer
                ${path=='/questionbank' && 'font-bold'}`} style={{textShadow: path === '/questionbank' ? '0 10px 5px rgba(255, 140, 0, 0.3)' : 'none',}}>Question Bank</li>
        </ul>
        <UserButton/>
    </div>
  )
}

export default Header