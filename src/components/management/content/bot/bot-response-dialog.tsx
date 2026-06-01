"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChatAutoResponse } from "@/services/chat-bot.service";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BotResponseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ChatAutoResponse, "id"> & { id?: number }) => Promise<void>;
    response?: ChatAutoResponse | null;
}

export function BotResponseDialog({ isOpen, onClose, onSave, response }: BotResponseDialogProps) {
    const [trigger, setTrigger] = useState("");
    const [responseBody, setResponseBody] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (response) {
            setTrigger(response.trigger || "");
            setResponseBody(response.response || "");
        } else {
            setTrigger("");
            setResponseBody("");
        }
    }, [response, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!trigger.trim() || !responseBody.trim()) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        setLoading(true);
        try {
            await onSave({
                id: response?.id,
                trigger: trigger.trim(),
                response: responseBody.trim(),
                isActive: response ? response.isActive : true
            });
            onClose();
        } catch (error) {
           
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{response ? "Editar Respuesta Automática" : "Nueva Respuesta Automática"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="trigger">Disparador (Trigger)</Label>
                        <Input 
                            id="trigger"
                            placeholder="Ej: hola, horario, envíos..."
                            value={trigger}
                            onChange={(e) => setTrigger(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            La palabra o frase que el usuario debe escribir para activar esta respuesta.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="response">Respuesta del Bot</Label>
                        <Textarea 
                            id="response"
                            placeholder="Escribe la respuesta que dará el bot..."
                            className="min-h-[120px]"
                            value={responseBody}
                            onChange={(e) => setResponseBody(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="hover:cursor-pointer">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="hover:cursor-pointer">
                            {loading ? "Guardando..." : response ? "Actualizar" : "Crear Respuesta"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
