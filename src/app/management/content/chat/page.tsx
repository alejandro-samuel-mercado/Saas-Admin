"use client";

import { AdminChatView } from "@/components/chat/AdminChatView";

export default function ChatPage() {
    return (
        <div className="h-full flex flex-col mb-40">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Chat en Vivo</h1>
                <p className="text-muted-foreground">Gestiona las conversaciones con los clientes en tiempo real.</p>
            </div>
            <div className="flex-1">
                <AdminChatView />
            </div>
        </div>
    );
}
