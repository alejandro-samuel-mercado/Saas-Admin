"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import api from "@/services/api"
import { useAuthStore } from "@/store/use-auth-store"
import { Lock, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [returnUrl, setReturnUrl] = useState<string | null>(null)
    const login = useAuthStore((state) => state.login)
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const url = params.get('returnUrl')
            if (url) setReturnUrl(decodeURIComponent(url))
        }
    }, [])

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/management')
        }
    }, [isAuthenticated, router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', { email, password })
            
            if (data.success) {
                const roleName = data.data.user.role?.name || "";
                if (roleName === 'CUSTOMER') {
                  
                    import('sonner').then(({ toast }) => toast.error('Acceso denegado. No tienes permisos de administrador.'));
                    setLoading(false)
                    return
                }

                login(data.data.user, data.data.tokens.accessToken)
                router.push(returnUrl || '/management')
            } 
        } catch (err: any) {
            console.debug('Login failed handled by interceptor');
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black selection:bg-slate-800 selection:text-white">
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
            </div>

            <Card className="w-full max-w-sm border-slate-800/50 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />
                
                <CardHeader className="space-y-4 pb-10 pt-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10 mb-2">
                        <div className="w-6 h-6 border-2 border-black rounded-full" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-medium tracking-tight text-white">PANEL DE ADMINISTRACIÓN</CardTitle>
                    </div>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 px-8 pb-4">
                        <div className="space-y-4 pt-2">
                             <div className="group relative mb-6">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500 dark:text-gray-300 focus:bg-red-500/10 transition-colors z-100" />
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="name@example.com"
                                    className="pl-9 h-11 bg-gray-200 dark:bg-gray-200 text-black border-zinc-800 focus:border-zinc-600 focus:ring-0  text-sm transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="group relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500 dark:text-gray-300 focus:bg-red-500/10 transition-colors z-100" />
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="••••••••"
                                    className="pl-9 h-11 bg-gray-200 dark:bg-gray-200 text-black border-zinc-800 focus:border-zinc-600 focus:ring-0 text-sm transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-8 pt-8">
                        <Button 
                            className="w-full h-11 bg-white hover:bg-zinc-200/80 hover:cursor-pointer hover:text-gray-800 text-black font-medium transition-all" 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin " />
                                    <span>Accediendo...</span>
                                </div>
                            ) : "Iniciar Sesión"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="absolute bottom-6 text-center">
                <p className="text-[10px] text-zinc-600 font-mono tracking-widest">SISTEMA SEGURO por UnixxTech

                </p>
            </div>
        </div>
    )
}
