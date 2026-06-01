"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"

export default function SalesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    )
}
