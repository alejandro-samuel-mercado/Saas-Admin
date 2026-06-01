"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";
import api from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Send, User, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Message {
  text: string;
  content?: string; 
  sender: 'USER' | 'ADMIN' | 'BOT';
  createdAt: string;
}

interface Conversation {
  id: number;
  user?: {
    name: string;
    email: string;
  };
  messages: Message[];
  unread?: number;
  createdAt?: string;
}

export function AdminChatView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  
  const socket = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  const playNotificationSound = () => {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play().catch(() => {});
  };

  const fetchConversations = useCallback(async () => {
      try {
          const token = useAuthStore.getState().token;
          if (!token) return;

          const res = await api.get(`/chat/conversations`);
          
          if (res.data.status === 'success') {
              const mappedConversations = res.data.data.conversations.map((c: any) => ({
                  ...c,
                  messages: c.messages.map((m: any) => ({
                      ...m,
                      text: m.content || m.text
                  }))
              }));
              setConversations(mappedConversations);
          }
      } catch (error) {
      }
  }, []);

  const markAsRead = useCallback(async (cid: number) => {
    try {
        const token = useAuthStore.getState().token;
        if (!token) return;

        await api.post(`/chat/conversations/${cid}/read`);
        
        if (socket) {
            socket.emit('mark_read', { conversationId: cid });
        }

        setConversations(prev => prev.map(c => 
            c.id === cid ? { ...c, unread: 0 } : c
        ));
    } catch (error) {
        ;
    }
  }, [socket]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleAdminNotification = (data: any) => {
        if (data.type === 'new_message') {
            toast.info(`Nuevo mensaje de ${data.user?.name || 'Invitado'}`);
            playNotificationSound();

            setConversations(prev => {
                const existing = prev.find(c => c.id === data.conversationId);
                if (existing) {
                     const isChatActive = activeConversationId === data.conversationId;
                     if (isChatActive) markAsRead(data.conversationId);

                    
                     const updated: Conversation = {
                        ...existing,
                        messages: [...existing.messages, { text: data.text, sender: 'USER', createdAt: new Date().toISOString() }],
                        unread: isChatActive ? 0 : (existing.unread || 0) + 1
                    };
                    return [updated, ...prev.filter(c => c.id !== data.conversationId)];
                } else {
                    const newConv: Conversation = {
                        id: data.conversationId,
                        user: data.user, 
                        messages: [{ text: data.text, sender: 'USER', createdAt: new Date().toISOString() }],
                        unread: 1,
                        createdAt: new Date().toISOString()
                    };
                    return [newConv, ...prev];
                }
            });
        }
    };

    const handleMessageReceived = (msg: any) => {
         if (activeConversationId === msg.conversationId) {
             setConversations(prev => prev.map(c => {
                 if (c.id === activeConversationId) { 
                     
                     const exists = c.messages.some(m => 
                        (m.text === msg.text || m.content === msg.text) && 
                        (m.createdAt === msg.createdAt || Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1000)
                     );
                     if (exists) return c;
                     
                     const newMessage: Message = { 
                        text: msg.text, 
                        content: msg.text,
                        sender: msg.sender, 
                        createdAt: msg.createdAt || new Date().toISOString() 
                     };

                     
                     markAsRead(msg.conversationId);

                     return {
                        ...c,
                        messages: [...c.messages, newMessage],
                        unread: 0
                     };
                 }
                 return c;
             }));
         } else {
            setConversations(prev => {
                const existing = prev.find(c => c.id === msg.conversationId);
                if (existing) {
                    return prev.map(c => c.id === msg.conversationId ? { ...c, unread: (c.unread || 0) + 1 } : c);
                } else {
                   
                    return prev;
                }
            });
         }
    };

    socket.on('admin_notification', handleAdminNotification);
    socket.on('message_received', handleMessageReceived);

    socket.on('mark_read', ({ conversationId }: { conversationId: number }) => {
        setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, unread: 0 } : c
        ));
    });

    return () => {
        socket.off('admin_notification', handleAdminNotification);
        socket.off('message_received', handleMessageReceived);
        socket.off('mark_read');
    };
  }, [socket, activeConversationId, markAsRead]);
  
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;

    markAsRead(activeConversationId);

    const fetchDetails = async () => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) return;

            const res = await api.get(`/chat/conversations/${activeConversationId}`);
            
            if (res.data.status === 'success') {
                const fullConversation = res.data.data.conversation;
                const mappedMessages = fullConversation.messages.map((m: any) => ({
                    ...m,
                    text: m.content || m.text
                }));

                 setConversations(prev => prev.map(c => {
                    if (c.id === activeConversationId) {
                       
                        const dbMsgKeys = new Set(mappedMessages.map((m: any) => `${m.text}-${m.createdAt}`));
                        const mergedMessages = [...mappedMessages];
                        
                       
                        c.messages.forEach(m => {
                            if (m.sender === 'ADMIN') {
                                const isAlreadyInDB = mappedMessages.some((dbM: any) => 
                                    (dbM.text === m.text || dbM.content === m.text) && 
                                    Math.abs(new Date(dbM.createdAt).getTime() - new Date(m.createdAt).getTime()) < 2000
                                );
                                if (!isAlreadyInDB) {
                                    mergedMessages.push(m);
                                }
                            } else if (m.sender === 'USER') {
                               
                                const isAlreadyInDB = mappedMessages.some((dbM: any) => 
                                    (dbM.text === m.text || dbM.content === m.text) && 
                                    Math.abs(new Date(dbM.createdAt).getTime() - new Date(m.createdAt).getTime()) < 2000
                                );
                                if (!isAlreadyInDB) {
                                    mergedMessages.push(m);
                                }
                            }
                        });

                        mergedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                        return { ...c, messages: mergedMessages, user: fullConversation.user || c.user, unread: 0 };
                    }
                    return c;
                }));

                await api.post(`/chat/conversations/${activeConversationId}/read`);
            }
        } catch (error) {
        }
    };

    fetchDetails();
  }, [activeConversationId, markAsRead]);

  const handleSend = () => {
    if (!input.trim() || !activeConversationId || !socket) return;
    
    const text = input;
    setInput("");

    setConversations(prev => prev.map(c => c.id === activeConversationId ? {
        ...c,
        messages: [...c.messages, { text, sender: 'ADMIN', createdAt: new Date().toISOString() }]
    } : c));

    socket.emit('admin_message', { conversationId: activeConversationId, text });
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-6 bg-transparent">
        {/* Sidebar */}
        <div className={cn(
            "w-full md:w-1/3 bg-card p-2 rounded-2xl border-4 border-borderH/30 backdrop-blur-sm   shadow-lg shadow-borderH/20 flex flex-col transition-all",
            activeConversationId ? "hidden md:flex" : "flex"
        )}>
            <div className="p-4 border-b bg-muted/40">
                <h2 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-secondary" />
                    Conversaciones
                </h2>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {conversations.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground opacity-50">
                            No hay conversaciones
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => setActiveConversationId(conv.id)}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-all border  flex flex-col gap-1",
                                    activeConversationId === conv.id 
                                        ? "bg-secondary/5 border-secondary shadow-sm" 
                                        : "bg-background hover:bg-accent border-gray-300 hover:border-border"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm text-foreground">
                                        {conv.user?.name || `Invitado #${conv.id}`}
                                    </span>
                                    {conv.unread ? (
                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{conv.unread}</Badge>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(conv.messages[conv.messages.length - 1]?.createdAt || (conv as any).createdAt || new Date()), { addSuffix: true, locale: es })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {conv.user?.email || "Sin email"}
                                </p>
                                <p className="text-xs text-foreground/70 line-clamp-1 mt-1">
                                    {conv.messages.filter(m => m.sender !== 'BOT')[0]?.text || "..."}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>

        {/* Chat */}
        <div className={cn(
            "flex-1 bg-card rounded-2xl border-4 border-borderH/30 backdrop-blur-sm shadow-lg shadow-borderH/20 flex flex-col overflow-hidden",
            !activeConversationId ? "hidden md:flex" : "flex"
        )}>
            {!activeConversation ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                    <p>Selecciona una conversación para comenzar</p>
                 </div>
            ) : (
                <>
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="md:hidden -ml-2 h-8 w-8 hover:cursor-pointer"
                                onClick={() => setActiveConversationId(null)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            
                            <div className="h-10 w-10 bg-gradient-to-br from-secondary to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                {activeConversation.user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold leading-none">{activeConversation.user?.name || "Invitado"}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{activeConversation.user?.email}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            En línea
                        </Badge>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-black/20" ref={scrollRef}>
                         {activeConversation.messages
                            .filter(msg => msg.sender !== 'BOT')
                            .map((msg, i) => (
                            <div key={i} className={cn("flex", msg.sender === 'ADMIN' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                                    msg.sender === 'ADMIN' 
                                        ? "bg-secondary text-secondary-foreground rounded-br-sm" 
                                        : "bg-white dark:bg-zinc-800 border rounded-bl-sm"
                                )}>
                                    <p>{msg.text || msg.content}</p>
                                    <span className="text-[10px] opacity-70 block mt-1 text-right">
                                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t bg-background">
                         <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={() => activeConversationId && socket?.emit('typing', { conversationId: activeConversationId })}
                                onBlur={() => activeConversationId && socket?.emit('stop_typing', { conversationId: activeConversationId })}
                                placeholder="Escribe un mensaje..."
                                className="rounded-full bg-muted/50 border-input pl-4"
                            />
                            <Button type="submit" size="icon" className="rounded-full shrink-0 shadow-sm hover:cursor-pointer">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </div>
    </div>
  );
}
