"use client";

import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/services/stock-control.service";
import { FileText } from "lucide-react";
import { useState } from "react";

interface StockPDFReportProps {
    inventory: InventoryItem[];
    branchName: string;
    disabled?: boolean;
}

export function StockPDFReport({ inventory, branchName, disabled }: StockPDFReportProps) {
    const [generating, setGenerating] = useState(false);

    const handleGeneratePDF = async () => {
        setGenerating(true);
        try {

            const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');

            const styles = StyleSheet.create({
                page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10 },
                header: { marginBottom: 20 },
                title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
                subtitle: { fontSize: 11, color: '#666', marginBottom: 2 },
                date: { fontSize: 9, color: '#999' },
                summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
                summaryCard: { flex: 1, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 4 },
                summaryLabel: { fontSize: 8, color: '#666', marginBottom: 2 },
                summaryValue: { fontSize: 14, fontWeight: 'bold' },
                table: { marginTop: 10 },
                tableHeader: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '6 8', marginBottom: 2 },
                tableHeaderText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
                tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
                tableRowAlt: { flexDirection: 'row', padding: '5 8', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
                col1: { width: '15%' },
                col2: { width: '30%' },
                col3: { width: '15%' },
                col4: { width: '15%' },
                col5: { width: '10%', textAlign: 'center' },
                col6: { width: '15%', textAlign: 'right' },
                statusCritical: { color: '#dc2626', fontWeight: 'bold' },
                statusLow: { color: '#d97706', fontWeight: 'bold' },
                statusNormal: { color: '#16a34a' },
                footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#999' },
            });

            const getUnitAbbr = (unit: string) => {
                if (unit === 'KG') return 'kg';
                if (unit === 'LITRO') return 'L';
                if (unit === 'METRO') return 'm';
                return 'u';
            };

            const formatStockPDF = (stock: number, unit: string) => {
                const abbr = getUnitAbbr(unit);
                if (abbr === 'u') return `${Math.round(stock)} u`;
                return `${stock.toFixed(3).replace(/\.?0+$/, '')} ${abbr}`;
            };

            const criticalCount = inventory.filter(i => i.stock <= 0).length;
            const lowCount = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
            const normalCount = inventory.filter(i => i.stock > i.minStock).length;

            const getStatus = (item: InventoryItem) => {
                if (item.stock <= 0) return 'AGOTADO';
                if (item.stock <= item.minStock) return 'BAJO';
                return 'NORMAL';
            };

            const getStatusStyle = (item: InventoryItem) => {
                if (item.stock <= 0) return styles.statusCritical;
                if (item.stock <= item.minStock) return styles.statusLow;
                return styles.statusNormal;
            };

            const MyDocument = () => (
                <Document>
                    <Page size="A4" style={styles.page}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Reporte de Inventario</Text>
                            <Text style={styles.subtitle}>Branch: {branchName}</Text>
                            <Text style={styles.date}>
                                Generado: {new Date().toLocaleDateString('es-AR', { 
                                    year: 'numeric', month: 'long', day: 'numeric', 
                                    hour: '2-digit', minute: '2-digit' 
                                })}
                            </Text>
                        </View>

                     
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>TOTAL PRODUCTOS</Text>
                                <Text style={styles.summaryValue}>{inventory.length}</Text>
                            </View>
                            <View style={{ ...styles.summaryCard, backgroundColor: '#fef2f2' }}>
                                <Text style={styles.summaryLabel}>AGOTADOS</Text>
                                <Text style={{ ...styles.summaryValue, color: '#dc2626' }}>{criticalCount}</Text>
                            </View>
                            <View style={{ ...styles.summaryCard, backgroundColor: '#fffbeb' }}>
                                <Text style={styles.summaryLabel}>STOCK BAJO</Text>
                                <Text style={{ ...styles.summaryValue, color: '#d97706' }}>{lowCount}</Text>
                            </View>
                            <View style={{ ...styles.summaryCard, backgroundColor: '#f0fdf4' }}>
                                <Text style={styles.summaryLabel}>NORMAL</Text>
                                <Text style={{ ...styles.summaryValue, color: '#16a34a' }}>{normalCount}</Text>
                            </View>
                        </View>

                        {/* Table */}
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={{ ...styles.tableHeaderText, ...styles.col1 }}>SKU</Text>
                                <Text style={{ ...styles.tableHeaderText, ...styles.col2 }}>PRODUCTO</Text>
                                <Text style={{ ...styles.tableHeaderText, ...styles.col3 }}>CATEGORÍA</Text>
                                <Text style={{ ...styles.tableHeaderText, ...styles.col4 }}>VARIANTE</Text>
                                <Text style={{ ...styles.tableHeaderText, ...styles.col5 }}>STOCK</Text>
                                <Text style={{ ...styles.tableHeaderText, ...styles.col6 }}>ESTADO</Text>
                            </View>
                            {inventory.map((item, index) => (
                                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                    <Text style={{ ...styles.col1, fontSize: 8 }}>{item.skuCode}</Text>
                                    <Text style={{ ...styles.col2, fontSize: 8 }}>{item.productName}</Text>
                                    <Text style={{ ...styles.col3, fontSize: 8 }}>{item.categoryName}</Text>
                                    <Text style={{ ...styles.col4, fontSize: 8 }}>{item.variant || '-'}</Text>
                                    <Text style={{ ...styles.col5, fontSize: 9, fontWeight: 'bold' }}>
                                        {formatStockPDF(item.stock, item.measurementUnit ?? 'UNIDAD')}
                                    </Text>
                                    <Text style={{ ...styles.col6, fontSize: 8, ...getStatusStyle(item) }}>
                                        {getStatus(item)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Footer */}
                        <Text style={styles.footer}>
                            Sistema de Gestión de Inventario — Página 1 — {new Date().getFullYear()}
                        </Text>
                    </Page>
                </Document>
            );

            const blob = await pdf(<MyDocument />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `inventario_${branchName}_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={disabled || generating}
            className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
        >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{generating ? 'Generando...' : 'Reporte PDF'}</span>
        </Button>
    );
}
