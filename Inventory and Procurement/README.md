# VikingsERP · Inventory and Procurement

Inventory-staff workspace for ingredient and supply records, stock levels, movement adjustments, suppliers, purchase orders, reorder alerts, and inventory reports. It uses the requested black, red, and white interface and browser-local sample data for a self-contained preview.

## Run locally

1. Install Node.js 18 or newer and MySQL 8.
2. In this folder, run `npm install`.
3. Create the shared database and tables by running both modules' `database/schema.sql` files. If the database was set up earlier, run both updated schema files again to add account/session tables and migrate existing roles; existing table data is kept. If accounts already exist and no Owner has been assigned, the earliest account is promoted to Owner.
4. Run this module's `database/seed.sql` to create the supplier and sample stock records; then run POS and Billing's `database/seed.sql` to add the menu and ingredient recipes.
5. Copy `.env.example` to `.env` and set the MySQL credentials.
6. Run `npm run dev` to start both the API and Vite together. The API listens on port 4002. You can still run `npm run server` separately when needed.
7. Open the Vite URL shown in the terminal.

While running with `npm run dev`, both modules open directly in temporary demo mode without a sign-in form. Demo mode uses browser-local sample data; server-backed actions require signing in, and production builds retain normal authentication.

The first person to create an account becomes the **Owner**; later sign-ups receive **Staff**. The Owner can assign or remove **Manager** access from the account menu. Managers can sign in to both modules if the Owner is unavailable, but only the Owner can change account roles. Sign in separately in POS and Billing with the same email and password. Passwords are scrypt-hashed and sessions are stored in the shared database.

Role access is separated: Managers can access all Inventory & Procurement pages and reports, but not the Owner-only POS Dashboard in the POS module. The Owner can also view all Inventory pages and is the only role that can manage account roles. Staff can view stock, record stock adjustments, and see reorder alerts, but cannot access supplier or procurement pages. Inventory updates from the team are refreshed in open sessions from the shared MySQL database.

Both modules use the same `vikings_erp` database and shared `inventory_items` table. A completed, recipe-configured POS sale deducts ingredient quantities; receiving a recorded purchase order adds received quantities. The sign-in page requires the API and MySQL database to be running.
