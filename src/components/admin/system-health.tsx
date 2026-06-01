"use client";

import { SystemService } from "@/services/system-service";
import { Activity, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SystemHealth() {
    const [status, setStatus] = useState<'OK' | 'WARNING' | 'ERROR'>('OK');
    const [alerts, setAlerts] = useState(0);

    const checkHealth = async () => {
        try {
            const data = await SystemService.getSystemStatus();
            setStatus(data.status);
            setAlerts(data.active_alerts);
        } catch (error) {
            setStatus('ERROR');
        }
    };

    useEffect(() => {
        setTimeout(() => checkHealth(), 0);
        const interval = setInterval(checkHealth, 60000); 
        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case 'OK':
                return {
                    color: "text-green-400 bg-green-400/10 border-green-400/20",
                    icon: <ShieldCheck className="w-4 h-4" />,
                    text: "Seguro"
                };
            case 'WARNING':
                return {
                    color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
                    icon: <ShieldAlert className="w-4 h-4 text-orange-400" />,
                    text: `${alerts} Alertas`
                };
            case 'ERROR':
                return {
                    color: "text-red-400 bg-red-400/10 border-red-400/20",
                    icon: <Activity className="w-4 h-4 animate-pulse" />,
                    text: "Falla"
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Link href="/management/system/alerts">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all hover:bg-white/5 ${config.color}`}>
                {config.icon}
                <span className="hidden lg:inline">{config.text}</span>
                {status !== 'OK' && (
                     <span className="relative flex h-2 w-2 ml-1">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'WARNING' ? 'bg-orange-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'WARNING' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                    </span>
                )}
            </div>
        </Link>
    );
}
