# \# Odoo POS Cafe

# 

# A full-featured Restaurant Point of Sale (POS) system built for a hackathon, inspired by Odoo POS. Built with the PERN stack (PostgreSQL, Express, React, Node.js) — no ORM, raw SQL via node-postgres.

# 

# \## Features

# 

# \### Core POS

# \- Table-based ordering with Floor/Table view

# \- Fast billing \& checkout with live cart management

# \- Multiple payment methods: Cash, Digital (Card/Bank), UPI QR

# \- Kitchen Display with real-time order stages (To Cook → Preparing → Completed)

# \- Customer-facing display showing order details and live payment status

# 

# \### Backend Configuration (Admin)

# \- Product \& category management (with kitchen-routing flags)

# \- Payment method setup (enable/disable, UPI ID configuration)

# \- Floor \& table management

# \- POS session management (open/close, tied to staff user)

# 

# \### Reporting \& Dashboard

# \- Today's sales, order count, and active sessions at a glance

# \- Top-selling products

# \- Filterable sales report (by date range, session, responsible staff, product)

# \- CSV export of sales data

# 

# \### Self-Ordering (Token-Based)

# \- Staff generates a shareable self-order link per table

# \- Customers order directly from their phone — no login required

# \- Orders flow straight to Kitchen Display

# \- Customers can view live order/payment status and pay directly (Cash/Digital/UPI) from their device

# 

# \## Tech Stack

# 

# \- \*\*Database:\*\* PostgreSQL (raw SQL, `pg` driver — no ORM)

# \- \*\*Backend:\*\* Node.js + Express.js

# \- \*\*Frontend:\*\* React (Vite) + React Router

# \- \*\*Auth:\*\* JWT-based authentication with role-based access (admin/cashier)

# \- \*\*Styling:\*\* Inline CSS (no external UI framework)

# 

# \## Project Structure
odoo-pos-cafe/
├── backend/
│   ├── src/
│   │   ├── config/       # Database connection
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   ├── routes/       # API route definitions
│   │   ├── db/           # SQL schema
│   │   └── server.js     # Express app entry point
│   └── .env.example
└── frontend/
├── src/
│   ├── pages/         # All screens (Login, FloorView, OrderScreen, etc.)
│   ├── components/    # Shared components (ProtectedRoute)
│   ├── context/       # Auth context
│   ├── api/           # Axios instance
│   └── App.jsx
└── vite.config.js

## Setup Instructions

### Prerequisites
- Node.js (latest LTS)
- PostgreSQL installed and running
- pgAdmin (optional, for database management)

### 1. Clone the repository
git clone https://github.com/Poseidon1778/odoo-pos-cafe.git
cd odoo-pos-cafe

### 2. Backend setup
cd backend
npm install

Create a `.env` file (copy from `.env.example`) and fill in your PostgreSQL credentials:

PORT=5000
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=odoo_pos_cafe
JWT_SECRET=your_jwt_secret_here

Create the database and run the schema (via pgAdmin Query Tool or psql):

psql -U postgres -d odoo_pos_cafe -f src/db/schema.sql

Start the backend:

npm run dev

### 3. Frontend setup

cd ../frontend
npm install
npm run dev

Open `http://localhost:5173` in your browser.

"## Usage Flow

1. **Sign up / Log in** as a staff member (admin or cashier)
2. **Admin:** Configure categories, products, payment methods, and floors/tables via Backend Config
3. **Open a POS session** (currently via API — `POST /api/sessions/open`)
4. **Take orders:** Floor View → select table → add products to cart → confirm
5. **Process payment:** Choose Cash / Digital / UPI QR → validate
6. **Kitchen staff:** View and progress orders through Kitchen Display
7. **Customers:** Scan/open a self-order link to order and pay independently
8. **Admin:** Review sales via Dashboard, filter reports, export CSV

## API Overview

All endpoints are prefixed with `/api`. Key route groups:

- `/auth` — signup, login
- `/categories`, `/products` — catalog management
- `/payment-methods` — payment configuration
- `/floors`, `/tables` — floor plan management
- `/sessions` — POS session open/close
- `/orders` — order creation, kitchen status updates
- `/payments` — payment processing
- `/tokens` — self-order token generation/validation
- `/reports` — sales report and dashboard summary

Public (no-auth) endpoints exist for the self-ordering flow: `/products/public`, `/orders/self`, `/orders/public/:id`, `/payment-methods/public`, `/payments/public`.

## Known Limitations / Future Improvements

- No "Open Session" button in the UI yet — currently done via API call
- No product variant UI in Admin Panel (backend supports it)
- Basic booking feature (mentioned as optional in original scope) not implemented
- Styling is functional but minimal — no design system/component library
- No automated tests yet"

## License

Built for hackathon purposes.

