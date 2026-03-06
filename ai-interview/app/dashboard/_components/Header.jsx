"use client"
import { UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import Image from "next/image";

function Header() {
    const path = usePathname();
    useEffect(() => {
        console.log();
    }, [])
    return (
        <div className='flex p-4 items-center justify-between bg-secondary shadow-sm'>
            <Image
                src="/logo.svg"
                width={160}
                height={100}
                alt="logo"
            />
            <ul className='hidden md:flex gap-6'>
                <li className={`hover: text-primary hover:font-bold transition-all cursor-pointer
            ${path == '/dashboard' && 'text-primary font-bold'}
            `}>DashBoard</li>
                <li className={`hover: text-primary hover:font-bold transition-all cursor-pointer
            ${path == '/dashboard/question' && 'text-primary font-bold'}
            `}>Questions</li>
                <li className={`hover: text-primary hover:font-bold transition-all cursor-pointer
            ${path == '/dashboard/upgrade' && 'text-primary font-bold'}
            `}>Upgrade</li>
                <li className={`hover: text-primary hover:font-bold transition-all cursor-pointer
            ${path == '/dashboard/works' && 'text-primary font-bold'}
            `}>how it works</li>
            </ul>
            <UserButton />
        </div>
    )
}

export default Header 