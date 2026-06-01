"use client";

import { BankAccount, StoreConfig } from "@/types/extended";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, Building2, Plus } from "lucide-react";

export function BankAccountsManager({
    config,
    setConfig,
}: {
    config: Partial<StoreConfig>;
    setConfig: (config: Partial<StoreConfig>) => void;
}) {
    const accounts = config.bankAccounts || [];

    const handleAdd = () => {
        const newAccount: BankAccount = {
            id: Math.random().toString(36).substring(7),
            bankName: "",
            accountName: "",
            cbuCvu: "",
            alias: "",
        };
        setConfig({ ...config, bankAccounts: [...accounts, newAccount] });
    };

    const handleUpdate = (id: string, field: keyof BankAccount, value: string) => {
        const updated = accounts.map((acc) =>
            acc.id === id ? { ...acc, [field]: value } : acc
        );
        setConfig({ ...config, bankAccounts: updated });
    };

    const handleRemove = (id: string) => {
        const updated = accounts.filter((acc) => acc.id !== id);
        setConfig({ ...config, bankAccounts: updated });
    };

    return (
        <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-500" /> Cuentas Bancarias (Transferencias)
                    </CardTitle>
                    <CardDescription>
                        Añade las cuentas a mostrar cuando un cliente elige "Transferencia".
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2 hover:cursor-pointer mt-0">
                    <Plus className="h-4 w-4" /> Agregar Cuenta
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 pt-4">
                    {accounts.length === 0 ? (
                         <div className="p-4 border border-dashed rounded-lg bg-slate-50/50 text-center col-span-full">
                            <p className="text-sm text-muted-foreground">No has añadido ninguna cuenta bancaria.</p>
                        </div>
                    ) : (
                        accounts.map((acc) => (
                            <div key={acc.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50 relative group shadow-sm transition-all hover:border-indigo-300">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer z-10"
                                    onClick={() => handleRemove(acc.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Banco / Billetera</Label>
                                        <Input
                                            value={acc.bankName}
                                            onChange={(e) => handleUpdate(acc.id, "bankName", e.target.value)}
                                            placeholder="Ej: Mercado Pago"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Titular de la Cuenta</Label>
                                        <Input
                                            value={acc.accountName}
                                            onChange={(e) => handleUpdate(acc.id, "accountName", e.target.value)}
                                            placeholder="Ej: Juan Perez"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">CBU / CVU</Label>
                                        <Input
                                            value={acc.cbuCvu}
                                            onChange={(e) => handleUpdate(acc.id, "cbuCvu", e.target.value)}
                                            placeholder="22 dígitos"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Alias</Label>
                                        <Input
                                            value={acc.alias}
                                            onChange={(e) => handleUpdate(acc.id, "alias", e.target.value)}
                                            placeholder="mi.alias.mp"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
