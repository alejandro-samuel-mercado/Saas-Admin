# Sistema de Administración (Mini-ERP) - E-commerce Platform

Este es el panel de administración centralizado y B2B para la gestión integral del ecosistema eCommerce, control de inventario y punto de venta web (POS).

## 🚀 Características Principales

- **Gestión Avanzada de Catálogo**: Control absoluto sobre productos base, variantes dimensionales (SKUs), imágenes, precios y parametrización de medidas.
- **Stock Multi-Sucursal en Tiempo Real**: Inventario físico distribuido, alertas de "Stock Crítico", y transferencias internas inter-sucursal verificadas.
- **Punto de Venta Web (POS)**: Interfaz hiper-liviana diseñada para cajeros físicos, con soporte para emisión de tickets térmicos comerciales e integración de stock directa.
- **Motor de Promociones y Descuentos**: Creación de cupones complejos, reglas limitantes (Globales, Categoría, Producto) con protecciones anti-solapamiento (imposibilidad matemática de superar 100% off).
- **Dashboard y Analítica de Ventas**: Visualización de métricas clave en tiempo real: Ticket Promedio, Tasas de Recompra, Ingresos Netos y embudos geográficos.
- **Matriz Financiera Multimoneda**: Configuración de pasarelas de pago disponibles por divisa (ej. MercadoPago solo ARS, PayPal solo USD) y fluctuación controlada de Tipos de Cambio.
- **Módulo de Soporte al Cliente CX**: Incorporación estilo "Zendesk" integrado, un Inbox donde administradores y chatbots conversan mediante Sockets en tiempo real con clientes de la web.
- **Gestión Corporativa CMS**: Bajas y altas visuales de componentes web cliente (Marquesinas, FAQs, Banners, Blog) prescindiendo del código.

## 🛠️ Tecnologías Utilizadas

- **Frontend Core**: Next.js 14+ (App Router, SSG & SSR)
- **Gestión de Sesión e Invariante**: Zustand persistente
- **Capa Visual**: Tailwind CSS + Shadcn/UI (Radix UI) interpolada para Dark Mode puro.
- **Cliente API**: Axios con middleware inyector de autenticación y Branch-Context.
- **Búsqueda Indexada (Frontend)**: Fuse.js (Búsqueda difusa reactiva sin consultar a DB).

## ⚙️ Configuración y Ejecución

### Requisitos Previos

- Node.js 18+
- Instalar e inicializar la aplicación Backend primero para la exposición de enrutables API y Sockets.

### Instalación

```bash
# Instalar dependencias puras
npm install

# Instanciar el entorno de desarrollo
npm run dev

# Generar el paquete de producción enjaulado
npm run build
```

## 📁 Estructura del Proyecto

- `src/app`: Páginas segmentadas y seguras.
- `src/components`: Entornos de UI de gestión administrativa de alta complejidad.
- `src/services`: Rutas mapeadas a Factory Control.
- `src/store`: Memoria del cliente administrativo.
- `src/lib`: Motor matemático e inyección de contexto.

---
© 2026 Software Propietario. Todos los derechos reservados.
