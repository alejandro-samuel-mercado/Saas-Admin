"use client"

import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

interface DashboardCurrencyToggleProps {
    currentCurrency: string;
    currencies: any[];
    onToggle: (curr: string) => void;
}

export function DashboardCurrencyToggle({ currentCurrency, currencies, onToggle }: DashboardCurrencyToggleProps) {
    if (!currencies || currencies.length <= 1) return null;

    return (
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border overflow-x-auto max-w-[300px] no-scrollbar">
            {currencies.map((curr) => (
                <Button
                    key={curr.code}
                    variant={currentCurrency === curr.code ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`h-7  px-3 text-xs font-bold transition-all whitespace-nowrap hover:cursor-pointer ${currentCurrency === curr.code ? 'bg-primary dark:bg-zinc-700 shadow-sm text-white' : 'text-zinc-500'}`}
                    onClick={() => onToggle(curr.code)}
                >
                    {curr.code === 'USD' && <DollarSign className="h-3 w-3 mr-1" />}
                    {curr.code}
                </Button>
            ))}
        </div>
    );
}
