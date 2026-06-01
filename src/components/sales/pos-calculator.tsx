"use client";

import { useState, useEffect } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Calculator as CalculatorIcon, Delete, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function POSCalculator({
    total,
    currencyCode = "USD",
    currencySymbol = "$",
}: {
    total: number;
    currencyCode?: string;
    currencySymbol?: string;
}) {
    const [tenderedAmount, setTenderedAmount] = useState<string>("");
    const [change, setChange] = useState<number>(0);


    const [calcDisplay, setCalcDisplay] = useState("0");
    const [operator, setOperator] = useState<string | null>(null);
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [waitingForNewValue, setWaitingForNewValue] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        const raw = parseFloat(tenderedAmount);
        if (!isNaN(raw) && raw > 0) {
            setChange(raw - total);
        } else {
            setChange(0);
        }
    }, [tenderedAmount, total]);

    const handleTenderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(",", ".");
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            setTenderedAmount(val);
        }
    };

    const calculate = (prev: number, current: number, op: string) => {
        switch (op) {
            case "+":
                return prev + current;
            case "-":
                return prev - current;
            case "*":
                return prev * current;
            case "/":
                return current === 0 ? 0 : prev / current;
            default:
                return current;
        }
    };

    const handleCalcInput = (input: string) => {
        if (/\d/.test(input)) {
            if (waitingForNewValue) {
                setCalcDisplay(input);
                setWaitingForNewValue(false);
            } else {
                setCalcDisplay(calcDisplay === "0" ? input : calcDisplay + input);
            }
        } else if (input === ".") {
            if (waitingForNewValue) {
                setCalcDisplay("0.");
                setWaitingForNewValue(false);
            } else if (!calcDisplay.includes(".")) {
                setCalcDisplay(calcDisplay + ".");
            }
        } else if (["+", "-", "*", "/"].includes(input)) {
            const current = parseFloat(calcDisplay);
            if (operator && previousValue !== null && !waitingForNewValue) {
                const result = calculate(previousValue, current, operator);
                setCalcDisplay(String(result));
                setPreviousValue(result);
            } else {
                setPreviousValue(current);
            }
            setOperator(input);
            setWaitingForNewValue(true);
        } else if (input === "=") {
            if (operator && previousValue !== null) {
                const current = parseFloat(calcDisplay);
                const result = calculate(previousValue, current, operator);
                setCalcDisplay(String(result));
                setPreviousValue(null);
                setOperator(null);
                setWaitingForNewValue(true);
            }
        } else if (input === "C") {
            setCalcDisplay("0");
            setPreviousValue(null);
            setOperator(null);
            setWaitingForNewValue(false);
        } else if (input === "DEL") {
            if (!waitingForNewValue) {
                setCalcDisplay(calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : "0");
            }
        }
    };

    return (
        <div className="bg-muted/40 border-2 border-border rounded-xl p-3 space-y-3 relative mb-2">
            <div className="flex justify-between items-center">
                <Label className="text-[11px] font-black text-muted-foreground uppercase flex items-center gap-1">
                    <CalculatorIcon className="w-3 h-3" />
                    Cálculo de Vuelto
                </Label>

                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold hover:cursor-pointer flex items-center gap-1 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            Calculadora
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-[280px] p-4 bg-background border-2 border-border shadow-2xl rounded-xl" onInteractOutside={(e) => { e.preventDefault() }}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-xs uppercase text-muted-foreground">Calculadora</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsPopoverOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="bg-muted border border-border p-3 text-right font-mono text-2xl font-bold rounded-lg mb-4 tracking-tight overflow-x-auto min-h-[56px] flex items-center justify-end shadow-inner">
                            {calcDisplay}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <Button variant="secondary" className="font-bold border bg-red-100 hover:bg-red-200 text-red-700 hover:cursor-pointer dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50" onClick={() => handleCalcInput("C")}>C</Button>
                            <Button variant="secondary" className="font-bold border hover:cursor-pointer" onClick={() => handleCalcInput("/")}>/</Button>
                            <Button variant="secondary" className="font-bold border hover:cursor-pointer" onClick={() => handleCalcInput("*")}>×</Button>
                            <Button variant="secondary" className="font-bold border hover:cursor-pointer bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50" onClick={() => handleCalcInput("DEL")}>
                                <Delete className="w-4 h-4" />
                            </Button>

                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("7")}>7</Button>
                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("8")}>8</Button>
                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("9")}>9</Button>
                            <Button variant="secondary" className="font-bold border hover:cursor-pointer" onClick={() => handleCalcInput("-")}>-</Button>

                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("4")}>4</Button>
                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("5")}>5</Button>
                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("6")}>6</Button>
                            <Button variant="secondary" className="font-bold border hover:cursor-pointer" onClick={() => handleCalcInput("+")}>+</Button>

                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("1")}>1</Button>
                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("2")}>2</Button>
                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput("3")}>3</Button>
                            <Button variant="default" className="font-bold row-span-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white shadow-md shadow-blue-500/20" onClick={() => handleCalcInput("=")}>=</Button>

                            <Button variant="outline" className="font-bold border-2 col-span-2 hover:cursor-pointer" onClick={() => handleCalcInput("0")}>0</Button>
                            <Button variant="outline" className="font-bold border-2 hover:cursor-pointer" onClick={() => handleCalcInput(".")}>.</Button>
                        </div>
                        <Button
                            className="w-full font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 hover:cursor-pointer"
                            onClick={() => {
                                setTenderedAmount(calcDisplay);
                                setIsPopoverOpen(false);
                            }}
                        >
                            Usar como Monto
                        </Button>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Monto Recibido</Label>
                    <div className="relative">
                        <Input
                            placeholder="0.00"
                            value={tenderedAmount}
                            onChange={handleTenderedChange}
                            className="font-mono text-lg font-bold border-2 shadow-sm bg-background border-input focus:border-primary transition-colors"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Cambio a dar</Label>
                    <div className={cn(
                        "h-10 rounded-md border-2 px-3 py-2 text-lg font-mono font-bold flex items-center justify-end shadow-sm transition-colors",
                        !tenderedAmount ? "bg-muted border-transparent text-muted-foreground" :
                            change >= 0 ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-400" :
                                "bg-red-100 border-red-400 text-red-700 dark:bg-red-900/40 dark:border-red-600 dark:text-red-400"
                    )}>
                        {tenderedAmount ? formatCurrency(change >= 0 ? change : 0, currencyCode, currencySymbol) : "---"}
                    </div>
                    {change < 0 && tenderedAmount && (
                        <p className="text-[10px] text-red-600 font-bold uppercase text-right mt-1">Faltan {formatCurrency(Math.abs(change), currencyCode, currencySymbol)}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
