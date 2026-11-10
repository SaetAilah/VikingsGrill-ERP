# VikingsGrill-ERP · Unified Operations Suite

A unified, modular ERP application for **Vikings Grill (Bar · Billiards · KTV - Roxas Branch)**, combining frontline **POS & Billing** with **Kitchen Inventory & Procurement** into a single cohesive system. Reconstructed using the clean client-server MVC monorepo architecture matching `vikings_ra_kpi`.

---

## 1. System Architecture

```text
VikingsGrill-ERP/
├── backend/                          # Layered Express REST API (Port 4000)
│   ├── src/
│   │   ├── config/                   # MySQL connection pool & env parser
│   │   ├── controllers/              # auth, menu, sales, inventory, suppliers, procurement
│   │   ├── middleware/               # authMiddleware, roleMiddleware, errorMiddleware
│   │   ├── routes/                   # Clean Express routers (/api/*)
│   │   ├── utils/                    # Password scrypt & crypto helpers
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # API entry point
│   ├── .env / .env.example
│   └── package.json
│
├── frontend/                         # Modern React 18 SPA + Vite (Port 5173)
│   ├── src/
│   │   ├── components/layout/        # Sidebar.jsx, Navbar.jsx, MainLayout.jsx
│   │   ├── context/                  # AuthContext, PosContext, InventoryContext
│   │   ├── pages/
│   │   │   ├── pos/                  # POS Dashboard, Orders, Payment, Receipt, Menu
│   │   │   └── inventory/            # Inv Dashboard, Stock, Movements, Suppliers, POs
│   │   ├── services/                 # Axios API clients (authApi, posApi, inventoryApi)
│   │   ├── App.jsx                   # React Router routes (/pos/*, /inventory/*)
│   │   ├── main.jsx                  # Root entry with BrowserRouter & Context Providers
│   │   └── index.css                 # Dark Viking Red styling
│   ├── vite.config.js                # Port 5173 proxying /api to http://localhost:4000
│   └── package.json
│
├── database/                         # Unified Database Scripts
│   ├── schema.sql                    # Full database schema for MySQL
│   └── seed.sql                      # Initial vendors, ingredients, menu & recipes
│
├── start-all.bat                     # 1-click Windows launcher
└── package.json                      # Root workspace scripts
```

---

## 2. Quick Start

### Step 1: Database Setup (Laragon)
1. Start MySQL in Laragon.
2. In HeidiSQL (or terminal), run:
   * `database/schema.sql`
   * `database/seed.sql`

### Step 2: Start the Application

You can use the one-click launcher:
* Double-click `start-all.bat`

Or run them individually via PowerShell:

**Terminal 1 (Backend API):**
```powershell
cd backend
npm run dev
```
*(Runs Express API on `http://localhost:4000`)*

**Terminal 2 (Frontend UI):**
```powershell
cd frontend
npm run dev
```
*(Runs Vite UI on `http://localhost:5173`)*

---

## 3. Key Enhancements in this Reconstructed Version
- **Unified Single Sign-On:** One login grants access across all POS and Inventory screens with RBAC (Owner, Manager, Staff).
- **React Router Navigation:** Instant client-side transitions across `/pos/orders`, `/pos/menu`, `/inventory/items`, etc. without page reloads.
- **Audited Stock Depletion:** POS checkout automatically writes ingredient deductions into `stock_movements`.
- **Decoupled State Management:** `PosContext` and `InventoryContext` replace monolithic single-file components.
- **Companion Analytics Integration:** Direct link in the navigation sidebar to the `vikings_ra_kpi` decision-support suite.

