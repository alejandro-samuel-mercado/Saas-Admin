# Admin Panel (Mini-ERP) - E-commerce Platform

This is the centralized administrative B2B panel for the comprehensive management of the eCommerce ecosystem, inventory control, and web-based Point of Sale (POS).

## 🚀 Core Features

- **Advanced Catalog Management**: Absolute control over base products, dimensional variants (SKUs), images, pricing, and unit measurements parameters.
- **Real-Time Multi-Branch Stock**: Distributed physical inventory, "Critical Stock" alerts, and verified inter-branch internal transfers.
- **Web Point of Sale (POS)**: Hyper-lightweight interface designed for physical cashiers, with support for commercial thermal ticket emission and direct stock integration.
- **Promotions & Discounts Engine**: Creation of complex coupons, restricting rules (Global, Category, Product) with anti-overlapping protections (mathematical impossibility of exceeding 100% off).
- **Dashboard & Sales Analytics**: Real-time visualization of key metrics: Average Ticket, Repurchase Rates, Net Revenue, and geographic funnels.
- **Multi-Currency Financial Matrix**: Configuration of available payment gateways per currency (e.g., MercadoPago only for ARS, PayPal only for USD) and controlled exchange rate fluctuations.
- **CX Customer Support Module**: Integrated "Zendesk"-style Inbox, where administrators and chatbots converse via real-time Sockets with clients on the main web.
- **Corporate CMS Management**: Visual additions and removals of client web components (Marquees, FAQs, Banners, Blog) without needing code modifications.

## 🛠️ Technology Stack

- **Frontend Core**: Next.js 14+ (App Router, SSG & SSR)
- **Session & Invariant Management**: Persistent Zustand
- **Visual Layer**: Tailwind CSS + Shadcn/UI (Radix UI) interpolated for pure Dark Mode.
- **API Client**: Axios with authentication and Branch-Context injector middleware.
- **Indexed Search (Frontend)**: Fuse.js (Reactive fuzzy search without DB querying).

## ⚙️ Setup & Execution

### Prerequisites

- Node.js 18+
- Install and initialize the Backend application first for API and Socket routing exposure.

### Installation

```bash
# Install dependencies
npm install

# Instantiate the development environment
npm run dev

# Generate the caged production package
npm run build
```

## 📁 Project Structure

- `src/app`: Segmented and secured pages.
- `src/components`: High-complexity administrative management UI environments.
- `src/services`: Routes mapped to Factory Control.
- `src/store`: Administrative client memory.
- `src/lib`: Mathematical engine and context injection.

---
© 2026 Proprietary Software. All rights reserved.
