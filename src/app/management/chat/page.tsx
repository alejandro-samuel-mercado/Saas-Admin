"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { knowledgeBaseService } from "@/services/knowledge-base.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function KnowledgeBasePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [answer, setAnswer] = useState("");
  
  const queryClient = useQueryClient();

  const { data: responses, isLoading } = useQuery({
    queryKey: ["auto-responses"],
    queryFn: knowledgeBaseService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: knowledgeBaseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-responses"] });
      setIsOpen(false);
      setKeywords("");
      setAnswer("");
      toast.success("Respuesta automática creada");
    },
    onError: () => toast.error("Error al crear respuesta"),
  });

  const deleteMutation = useMutation({
    mutationFn: knowledgeBaseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-responses"] });
      toast.success("Respuesta eliminada");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || !answer.trim()) return;
    
    const keywordArray = keywords.split(",").map(k => k.trim()).filter(k => k.length > 0);
    
    createMutation.mutate({ keywords: keywordArray, answer });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Conocimiento (Bot)</h1>
          <p className="text-muted-foreground">Gestiona las respuestas automáticas del asistente virtual.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 hover:cursor-pointer">
              <Plus className="w-4 h-4" /> Nueva Respuesta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Respuesta Automática</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Palabras Clave (separadas por coma)</Label>
                <Input 
                  placeholder="precio, costo, envio, tarjeta" 
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Si el usuario menciona alguna de estas palabras, el bot responderá.</p>
              </div>
              <div className="space-y-2">
                <Label>Respuesta del Bot</Label>
                <Textarea 
                  placeholder="El envío es gratis para compras superiores a..." 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full hover:cursor-pointer" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-borderH" />
            Respuestas Activas
          </CardTitle>
          <CardDescription>
            El sistema buscará coincidencias en estas reglas cuando no haya agentes en línea.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">Cargando...</div>
          ) : responses?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay respuestas configuradas. Agrega la primera para activar el Bot.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Palabras Clave</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.keywords.map((k, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <p className="line-clamp-2 text-sm text-foreground/80">{item.answer}</p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:cursor-pointer"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
