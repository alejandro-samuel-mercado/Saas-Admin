"use client"

import { Sidebar } from "./sidebar"

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex h-[100dvh] bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
            <Sidebar className="hidden md:flex" />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
