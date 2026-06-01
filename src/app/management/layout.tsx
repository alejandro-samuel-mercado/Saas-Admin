"use client"

import { Sidebar } from "@/components/admin/sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"

import { Header } from "@/components/admin/header"
import { AdminChatWidget } from "@/components/chat/AdminChatWidget"

export default function ManagementLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <div className="flex h-[100dvh] bg-primary overflow-hidden transition-colors duration-300">
                <Sidebar className="hidden md:flex" />
                <AdminChatWidget />
                   
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    <Header />
                    <div className="flex-1 overflow-hidden p-0 relative">
                       
                        <div className="h-full w-full bg-slate-100 dark:bg-zinc-950 md:rounded-tl-3xl shadow-inner overflow-hidden flex flex-col relative z-0 transition-colors duration-300 ">
                             <div className="flex-1 overflow-y-auto p-1 sm:p-4 md:p-8 md:pt-0 custom-scrollbar">
                                {children}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
