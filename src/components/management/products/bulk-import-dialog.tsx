"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { ProductsAPI } from "@/services/api";

interface BulkImportDialogProps {
    onSuccess: () => void;
}

export function BulkImportDialog({ onSuccess }: BulkImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    if (jsonData.length === 0) {
                        throw new Error("El archivo está vacío.");
                    }

                    await ProductsAPI.bulkImport(jsonData);
                    
                    toast({
                        title: "Importación exitosa",
                        description: `Se han importado ${jsonData.length} registros correctamente.`,
                    });
                    
                    setOpen(false);
                    setFile(null);
                    onSuccess();
                } catch (error: any) {
                    toast({
                        title: "Error de Importación",
                        description: error.message || "Ocurrió un error al procesar el archivo.",
                        variant: "destructive",
                    });
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            setLoading(false);
            toast({
                title: "Error",
                description: "No se pudo leer el archivo.",
                variant: "destructive",
            });
        }
    };

    const downloadTemplate = () => {
        const template = [
            {
                Nombre: "Producto Ejemplo",
                Marca: "MarcaX",
                Categoria: "Electrónica",
                Descripcion: "Descripción del producto",
                Precio_Base: 1000,
                Codigo_SKU: "SKU-001",
                Precio_SKU: 1000,
                Stock_Inicial: 10,
                Codigo_Barras: "1234567890",
                Unidad_Medida: "UNIDAD"
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, "plantilla_importacion_productos.xlsx");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Carga Masiva de Productos</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx) o CSV para importar productos y variantes en bloque.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-8 space-y-4 hover:border-primary/50 transition-colors">
                        <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                {file ? file.name : "Selecciona un archivo"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                .xlsx o .csv soportados
                            </p>
                        </div>
                        <Input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            id="bulk-file-input"
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="secondary"
                            onClick={() => document.getElementById("bulk-file-input")?.click()}
                            disabled={loading}
                        >
                            Elegir Archivo
                        </Button>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-bold mb-1 font-black underline uppercase tracking-widest">Información importante:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Las categorías se buscarán por nombre.</li>
                                <li>Si el SKU ya existe, se omitirá o actualizará según configuración.</li>
                                <li>Asegúrate de que los precios sean numéricos.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                        <span className="text-xs font-medium">¿No tienes la plantilla?</span>
                        <Button variant="link" size="sm" onClick={downloadTemplate} className="h-auto p-0 text-xs">
                            Descargar Plantilla
                        </Button>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || loading} className="bg-secondary text-white">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            "Subir e Importar"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
