/**
 * Utilitario para exportar datos JSON a CSV y descargar el archivo
 */
export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) return;

    // Obtener las cabeceras del primer objeto
    const headers = Object.keys(data[0]);
    
    // Crear las filas del CSV
    const csvRows = [
        
        headers.join(','),
       
        ...data.map(row => {
            return headers.map(fieldName => {
                const value = row[fieldName];
                
                const escaped = ('' + (value ?? '')).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',');
        })
    ].join('\n');

    // Crear un blob y descargar
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
