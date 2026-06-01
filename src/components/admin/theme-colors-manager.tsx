"use client";

import { StoreConfig } from "@/types/extended";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Palette, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeColorsManager({
    config,
    setConfig,
}: {
    config: Partial<StoreConfig>;
    setConfig: (config: Partial<StoreConfig>) => void;
}) {
    const themeColors = config.themeColors || {};

    const hexToHsl = (hex: string): string => {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    }

    const setVariable = (key: string, hexValue: string) => {
        const newColors = { ...themeColors };
        newColors[`${key}-hex`] = hexValue;
        newColors[key] = hexToHsl(hexValue);
        setConfig({ ...config, themeColors: newColors });
    };

    const handleClear = () => {
        setConfig({ ...config, themeColors: {} });
    };

    const variables = [
        { key: "background", label: "Fondo General", defaultHex: "#f8f9fa" },
        { key: "foreground", label: "Texto Principal", defaultHex: "#212529" },
        { key: "card", label: "Fondo de Tarjetas", defaultHex: "#ffffff" },
        { key: "card-foreground", label: "Texto de Tarjetas", defaultHex: "#212529" },
        { key: "primary", label: "Color Primario", defaultHex: "#6366f1" },
        { key: "primary-foreground", label: "Texto Primario", defaultHex: "#ffffff" },
        { key: "secondary", label: "Color Secundario", defaultHex: "#a855f7" },
        { key: "secondary-foreground", label: "Texto Secundario", defaultHex: "#ffffff" },
        { key: "muted", label: "Elementos Tenues", defaultHex: "#f1f5f9" },
        { key: "accent", label: "Acentuado", defaultHex: "#fbbf24" },
        { key: "border", label: "Bordes", defaultHex: "#e2e8f0" },
        { key: "input", label: "Campos de Entrada", defaultHex: "#e2e8f0" },
    ];

    return (
        <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-pink-500" /> Colores de la Tienda
                    </CardTitle>
                    <CardDescription>
                        Personaliza los colores exactos de tu página. Usa el selector para cambiar un componente.
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleClear} className="gap-2 text-xs">
                    <RefreshCcw className="h-4 w-4" /> Hard Reset
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    {variables.map(v => (
                        <div key={v.key} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 shadow-sm transition hover:border-pink-300">
                            <input 
                                type="color" 
                                value={themeColors[`${v.key}-hex`] || v.defaultHex}
                                onChange={(e) => setVariable(v.key, e.target.value)}
                                className="w-10 h-10 p-0 border-0 rounded cursor-pointer shrink-0"
                            />
                            <div className="flex flex-col">
                                <Label className="text-xs font-semibold cursor-pointer">{v.label}</Label>
                                <span className="text-[10px] text-muted-foreground font-mono">--{v.key}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
