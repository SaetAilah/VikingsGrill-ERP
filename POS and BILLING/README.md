# VikingsERP · POS and Billing

Cashier workspace covering the POS dashboard, order processing, checkout, payment recording, receipt printing, transaction history, and sales review. The interface uses the requested black, red, and white palette and includes browser-local sample data so it can be previewed before MySQL is configured.

## Run locally

1. Install Node.js 18 or newer and MySQL 8.
2. In this folder, run `npm install`.
3. Create the shared database and tables by running both modules' `database/schema.sql` files. If the database was set up earlier, run both updated schema files again to add account/session tables and migrate existing roles; existing table data is kept. If accounts already exist and no Owner has been assigned, the earliest account is promoted to Owner.
4. Seed supplier and stock data with Inventory and Procurement's `database/seed.sql`, then seed the menu and recipes with this module's `database/seed.sql`.
5. Copy `.env.example` to `.env` and set the MySQL credentials.
6. Run `npm run dev` to start both the API and Vite together. The API listens on port 4001. You can still run `npm run server` separately when needed.
7. Open the Vite URL shown in the terminal.

While running with `npm run dev`, both modules open directly in temporary demo mode without a sign-in form. Demo mode uses browser-local sample data; server-backed actions require signing in, and production builds retain normal authentication.

The first person to create an account becomes the **Owner**; later sign-ups receive **Staff**. The Owner can assign or remove **Manager** access from the account menu. Managers can sign in to both modules if the Owner is unavailable, but only the Owner can change account roles. Sign in separately in Inventory and Procurement with the same email and password. Passwords are scrypt-hashed and sessions are stored in the shared database.

Role access is separated: the Owner can view the POS dashboard, transaction history, sales transactions, and menu management. Managers can process orders and payments, view transaction history and sales transactions, and manage the menu. Staff can process orders and payments and add, edit, or remove menu items, but cannot open transaction history or sales reports. Only the Owner can manage account roles.

All roles can use **Menu Management** in the POS sidebar to add, edit, or remove menu items. Changes are stored in the shared MySQL database and refresh in open POS sessions. Removing an item makes it unavailable for new orders while preserving old transaction records. The seeded menu entries are examples; replace them with the restaurant's actual menu. Avoid rerunning the POS seed file after editing menu data, because it resets the seeded items to their sample values.

A connected sale is written transactionally; configured recipe quantities are deducted from `inventory_items` in the same database transaction. Configure the restaurant's approved tax and service-charge rules before using this for live billing. Payment methods are staff-recorded only; no external payment gateway is enabled.
