"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";
import api from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useConfigStore } from "@/store/config.store";
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
}

export function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  
  const { config } = useConfigStore();
  const socket = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  const enabledModules = config?.planInfo?.enabledModules || [];
  const hasChatAccess = enabledModules.includes('bot') || enabledModules.includes('chat');

  const playNotificationSound = () => {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play().catch(() => {});
  };

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
        
    }
  }, [socket]);

  useEffect(() => {
    /**
     * Obtiene la lista de conversaciones inicial
     */
    const fetchConversations = async () => {
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
    };

    fetchConversations();

    if (!socket) return;

    socket.on('admin_notification', (data: any) => {
        if (data.type === 'new_message') {
            toast.info(`Nuevo mensaje de ${data.user?.name || 'Invitado'}`);
            playNotificationSound();
            
            const isChatActive = activeConversationId === data.conversationId;
            if (isChatActive) markAsRead(data.conversationId);

            setConversations(prev => {
                const existing = prev.find(c => c.id === data.conversationId);
                if (existing) {
                    return [
                        { 
                            ...existing, 
                            messages: [...existing.messages, { text: data.text, sender: 'USER', createdAt: new Date().toISOString() }],
                            unread: isChatActive ? 0 : (existing.unread || 0) + 1
                        },
                        ...prev.filter(c => c.id !== data.conversationId)
                    ];
                } else {
                    return [{
                        id: data.conversationId,
                        user: data.user, 
                        messages: [{ text: data.text, sender: 'USER', createdAt: new Date().toISOString() }],
                        unread: isChatActive ? 0 : 1,
                        createdAt: new Date().toISOString()
                    }, ...prev];
                }
            });
        }
    });

    socket.on('message_received', (msg: any) => {
         if (activeConversationId === msg.conversationId) {
             setConversations(prev => prev.map(c => {
                 if (c.id === activeConversationId) { 
                     const exists = c.messages.some(m => m.text === msg.text && m.createdAt === msg.createdAt);
                     if (exists) return c;
                     
                     markAsRead(msg.conversationId);

                     return {
                        ...c,
                        messages: [...c.messages, { text: msg.text, sender: msg.sender, createdAt: msg.createdAt || new Date().toISOString() }],
                        unread: 0
                     };
                 }
                 return c;
             }));
         } else if (msg.sender === 'USER') {
             setConversations(prev => prev.map(c => 
                 c.id === msg.conversationId ? { ...c, unread: (c.unread || 0) + 1 } : c
             ));
         }
    });

    socket.on('mark_read', ({ conversationId }: { conversationId: number }) => {
        setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, unread: 0 } : c
        ));
    });

    return () => {
        socket.off('admin_notification');
        socket.off('message_received');
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

                setConversations(prev => prev.map(c => 
                    c.id === activeConversationId ? { ...c, messages: mappedMessages, user: fullConversation.user || c.user } : c
                ));
            }
        } catch (error) {
        }
    };

    fetchDetails();
  }, [activeConversationId, markAsRead]);

  /**
   * Envía un mensaje como administrador
   */
  const handleSend = () => {
    if (!input.trim() || !activeConversationId || !socket) {
        return;
    }
    
    const text = input;
    setInput("");

    setConversations(prev => prev.map(c => c.id === activeConversationId ? {
        ...c,
        messages: [...c.messages, { text, sender: 'ADMIN', createdAt: new Date().toISOString() }]
    } : c));

    socket.emit('admin_message', { conversationId: activeConversationId, text });
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  if (!hasChatAccess) return null;

  return (
    <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-7   z-50  ">
      <Sheet open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
              const token = useAuthStore.getState().token;
              if (token) {
                  api.get(`/chat/conversations`).then(res => {
                      if (res.data.status === 'success') {
                          const mapped = res.data.data.conversations.map((c: any) => ({
                              ...c,
                              messages: c.messages.map((m: any) => ({ ...m, text: m.content || m.text }))
                          }));
                          setConversations(mapped);
                      }
                  }).catch(() => {});
              }
          }
      }}>
        <SheetTrigger asChild>
            <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-xl bg-gray-500 border-2 border-secondary/50 hover:border-secondary transition-all hover:scale-105 hover:cursor-pointer "
            >
                <div className="relative">
                    <MessageSquare className="w-6 h-6 text-white" />
                    {conversations.some(c => (c.unread || 0) > 0) && (
                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse border border-white"></span>
                    )}
                </div>
            </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[100%] sm:w-[540px] p-0 flex flex-col bg-card border-l">
            {!activeConversation ? (
              
                <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 border-b bg-muted/40">
                        <SheetTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-secondary" />
                            Mensajes de Clientes
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-1 p-4">
                        {conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground opacity-50">
                                <MessageSquare className="w-12 h-12 mb-4" />
                                <p>No hay conversaciones activas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {conversations.map(conv => (
                                    <div 
                                        key={conv.id}
                                        onClick={() => setActiveConversationId(conv.id)}
                                        className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-secondary/10 p-2 rounded-full">
                                                    <User className="w-4 h-4 text-secondary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm">{conv.user?.name || `Invitado #${conv.id}`}</h4>
                                                    <p className="text-xs text-muted-foreground">{conv.user?.email}</p>
                                                </div>
                                            </div>
                                            {conv.unread ? (
                                                <Badge variant="destructive" className="rounded-full px-2">{conv.unread}</Badge>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(conv.messages[conv.messages.length - 1]?.createdAt || (conv as any).createdAt || new Date()), { addSuffix: true, locale: es })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-foreground/80 line-clamp-1 pl-10">
                                            {conv.messages.filter(m => m.sender !== 'BOT').reverse()[0]?.text || "Nuevos mensajes"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            ) : (
                
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b bg-muted flex items-center justify-between ">
                         <div className="flex items-center gap-3 ">
                            <Button    variant="ghost" size="icon" onClick={() => setActiveConversationId(null)} className="rounded-full hover:bg-white/10 hover:cursor-pointer">
                                <X className="w-5 h-5" />
                            </Button>
                            <div>
                                <h3 className="font-bold text-sm">{activeConversation.user?.name || "Invitado"}</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    <span className="text-xs text-muted-foreground">En vivo</span>
                                </div>
                            </div>
                         </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20" ref={scrollRef}>
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

                    <div className="p-4 border-t bg-card">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe una respuesta..."
                                className="rounded-full bg-muted/50 border-input"
                            />
                            <Button type="submit" size="icon" className="rounded-full shrink-0 hover:cursor-pointer">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
