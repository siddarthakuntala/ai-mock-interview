"use client"
import { UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import React from 'react'
import Image from "next/image";
import Link from "next/link";

function Header() {
    const path = usePathname();

    // hide navbar on interview pages
    if (path.includes("/dashboard/interview/")) {
        return null;
    }

    return (
        <div className='flex p-4 items-center justify-between bg-secondary shadow-sm'>
            
            <Image
                src="/logo.svg"
                width={70}
                height={50}
                alt="logo"
            />

            <ul className='hidden md:flex gap-6'>
                
                <Link href="/dashboard">
                    <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer
                    ${path === '/dashboard' && 'text-primary font-bold'}`}>
                        Dashboard
                    </li>
                </Link>

                <Link href="/dashboard/question">
                    <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer
                    ${path === '/dashboard/question' && 'text-primary font-bold'}`}>
                        Questions
                    </li>
                </Link>

                <Link href="/dashboard/works">
                    <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer
                    ${path === '/dashboard/works' && 'text-primary font-bold'}`}>
                        How it works
                    </li>
                </Link>

            </ul>

            <UserButton />
        </div>
    )
}

export default Header