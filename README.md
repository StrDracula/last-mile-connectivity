# Last-Mile Delivery Tracker

A full-stack delivery management platform designed to simplify last-mile logistics operations through automated pricing, zone-based delivery management, intelligent agent assignment, order tracking, rescheduling, and customer notifications.

The system supports three user roles — **Customer, Delivery Agent, and Admin** — with role-specific workflows and access control.

---

## 1. Project Overview

Last-mile delivery operations involve several interconnected processes:

- Dynamic delivery pricing
- Pickup and drop-zone identification
- Delivery-agent assignment
- Order status management
- Failed-delivery handling
- Rescheduling
- Customer notifications
- Administrative monitoring

This project provides a centralized platform to manage the complete delivery lifecycle.

### Core Flow

```text
Customer/Admin
      |
      v
Create Order
      |
      v
Pickup & Drop Zone Detection
      |
      v
Volumetric Weight Calculation
      |
      v
Billable Weight
      |
      v
B2B/B2C Rate Card
      |
      v
COD Surcharge
      |
      v
Final Delivery Charge
      |
      v
Agent Assignment
      |
      v
Order Tracking
      |
      +----> Delivered
      |
      +----> Failed
                 |
                 v
             Reschedule
                 |
                 v
          Agent Reassignment
```

---

# 2. Key Features

## Customer

- Register and log in
- Create delivery orders
- Enter pickup and drop addresses
- Enter package dimensions and actual weight
- Select B2B/B2C order type
- Select Prepaid/COD payment type
- View calculated delivery charge before confirmation
- View current order status
- View complete tracking timeline
- Receive delivery status notifications
- Request rescheduling after failed delivery

## Delivery Agent

- Secure role-based login
- View assigned deliveries
- View order and customer details
- Update delivery status
- Track assigned order lifecycle
- Mark deliveries as failed
- Continue delivery after reassignment/rescheduling

## Admin

- View all orders
- Filter orders by status, zone, and agent
- Create orders on behalf of customers
- Manage delivery zones
- Map areas to zones
- Configure B2B/B2C rate cards
- Configure intra-zone and inter-zone pricing
- Configure COD surcharge
- Manually assign agents
- Trigger automatic agent assignment
- Override order status
- Monitor agents and orders

---

# 3. Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API routes / server-side application logic
- NextAuth for authentication
- Zod for request validation

### Database

- PostgreSQL
- Neon PostgreSQL
- Prisma ORM

### Notifications

- Nodemailer
- SMTP-based email notifications

### Development

- Node.js
- npm
- Prisma CLI
- TypeScript

---

# 4. System Architecture

```text
+---------------------------------------------+
|                 Frontend                    |
|             Next.js + React                 |
|                                             |
| Customer | Agent | Admin Dashboards         |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|             Authentication Layer            |
|                  NextAuth                   |
|                                             |
|       CUSTOMER | AGENT | ADMIN              |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|              Application Logic              |
|                                             |
| Order Management                            |
| Rate Calculation                            |
| Zone Detection                              |
| Agent Assignment                            |
| Status Management                           |
| Rescheduling                                |
| Notifications                               |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|                   Prisma                    |
|                    ORM                      |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|             Neon PostgreSQL                 |
|                                             |
| Users | Orders | Agents | Zones             |
| Rates | Tracking | Reschedules              |
| Notifications                              |
+---------------------------------------------+
```

---

# 5. User Roles

The application uses role-based access control.

| Role | Main Responsibilities |
|------|------------------------|
| Customer | Create and track own orders |
| Agent | Manage assigned deliveries |
| Admin | Manage operations and configuration |

### Authentication

Unauthenticated users can access only public pages such as:

- Landing page
- Login
- Registration

Protected application routes require authentication.

Role-specific authorization prevents users from accessing functionality outside their role.

---

# 6. Rate Calculation Engine

The rate calculation engine is configuration-driven.

Delivery pricing is determined using administrator-configured rate cards rather than hardcoding individual pricing values into the order workflow.

## Step 1 — Zone Detection

Pickup and drop areas are mapped to zones using admin-configured `ZoneArea` records.

Example:

```text
560001 -> South
400001 -> West
```

If pickup and drop belong to the same zone:

```text
Zone Relation = INTRA
```

Otherwise:

```text
Zone Relation = INTER
```

---

## Step 2 — Volumetric Weight

Volumetric weight is calculated using:

```text
Volumetric Weight =
(L x B x H) / 5000
```

where package dimensions are provided in centimeters.

Example:

```text
Length  = 50 cm
Breadth = 40 cm
Height  = 30 cm

Volumetric Weight =
(50 x 40 x 30) / 5000
= 12 kg
```

---

## Step 3 — Billable Weight

The higher value between actual and volumetric weight is used:

```text
Billable Weight =
max(Actual Weight, Volumetric Weight)
```

Example:

```text
Actual Weight     = 8 kg
Volumetric Weight = 12 kg

Billable Weight   = 12 kg
```

---

## Step 4 — Rate Card Selection

The system selects the active rate card based on:

```text
Order Type
    +
Zone Relation
```

Supported combinations:

```text
B2C + INTRA
B2C + INTER
B2B + INTRA
B2B + INTER
```

Each rate card contains:

- Base Rate
- Rate Per Kg
- Effective Date
- Active Status

---

## Step 5 — Delivery Charge

The delivery charge is calculated using the selected rate card and billable weight:

```text
Base Charge =
Base Rate + (Rate Per Kg x Billable Weight)
```

---

## Step 6 — COD Surcharge

If payment type is:

```text
COD
```

the configured COD surcharge for the selected order type is added.

For prepaid orders:

```text
COD Surcharge = 0
```

---

## Final Charge

```text
Total Charge =
Base Charge + COD Surcharge
```

The calculated charge is displayed to the customer before order confirmation.

---

# 7. Agent Assignment

Agents have an availability state:

```text
AVAILABLE
BUSY
OFFLINE
```

Each agent also has a current operational zone.

For automatic assignment, the system considers available agents and their current operational zone to select a suitable delivery agent.

Administrators can also manually assign an agent when required.

The assignment mechanism is designed so that unavailable agents are not selected for new deliveries.

---

# 8. Order Lifecycle

Orders follow a defined status lifecycle:

```text
PLACED
   |
   v
PICKED_UP
   |
   v
IN_TRANSIT
   |
   v
OUT_FOR_DELIVERY
   |
   v
DELIVERED
```

A delivery can alternatively enter:

```text
FAILED
```

If delivery fails:

```text
FAILED
   |
   v
Customer requests reschedule
   |
   v
RESCHEDULED
   |
   v
New delivery attempt
   |
   v
Agent reassignment
```

---

# 9. Immutable Tracking History

The current order status is stored in the `Order` record.

Every status change is additionally recorded in:

```text
OrderStatusHistory
```

Each history record stores:

- Order ID
- Status
- Actor
- Actor role
- Timestamp
- Optional notes

Example:

```text
Order #LM12345

PLACED
2026-08-25 10:15
Actor: Customer

PICKED_UP
2026-08-25 11:05
Actor: Agent

IN_TRANSIT
2026-08-25 11:40
Actor: Agent

OUT_FOR_DELIVERY
2026-08-25 16:20
Actor: Agent
```

This provides a complete audit trail instead of relying only on the current order status.

---

# 10. Failed Delivery and Rescheduling

When an agent marks a delivery as failed:

1. The order status becomes `FAILED`.
2. The failure is recorded in the tracking history.
3. The customer is notified.
4. The customer can submit a reschedule request.
5. The new delivery date is stored.
6. A delivery agent can be reassigned for the new attempt.
7. The new delivery attempt continues through the normal status lifecycle.

Rescheduling information is stored separately in:

```text
RescheduleRequest
```

This keeps the original order history intact.

---

# 11. Notification System

The application maintains notification records using:

```text
NotificationLog
```

Supported notification channels:

```text
EMAIL
SMS
```

Email notifications are implemented using SMTP/Nodemailer.

Notification status is tracked as:

```text
SENT
FAILED
SKIPPED
```

If SMTP configuration is not provided during development, notifications can be recorded as `SKIPPED` rather than causing the order operation to fail.

---

# 12. Database Schema

The main entities are:

```text
User
 |
 +-- Agent
 |
 +-- Order
 |
 +-- OrderStatusHistory

Zone
 |
 +-- ZoneArea

Order
 |
 +-- OrderStatusHistory
 +-- RescheduleRequest
 +-- NotificationLog
 +-- Pickup Zone
 +-- Drop Zone
 +-- Assigned Agent

RateCard

CodConfig
```

### Main Tables

| Table | Purpose |
|------|---------|
| User | Authentication and user roles |
| Agent | Agent availability and current zone |
| Zone | Operational delivery zones |
| ZoneArea | Area-to-zone mapping |
| RateCard | Configurable delivery pricing |
| CodConfig | COD surcharge configuration |
| Order | Main delivery order |
| OrderStatusHistory | Immutable status audit trail |
| RescheduleRequest | Failed delivery rescheduling |
| NotificationLog | Notification audit records |

---

# 13. Project Structure

```text
last-mile-delivery-tracker/
|
+-- app/
|   +-- api/
|   +-- dashboard/
|   +-- admin/
|   +-- agent/
|   +-- orders/
|   +-- login/
|   +-- register/
|
+-- components/
|   +-- reusable UI components
|
+-- lib/
|   +-- authentication
|   +-- database
|   +-- rate calculation
|   +-- assignment
|   +-- notifications
|
+-- prisma/
|   +-- schema.prisma
|   +-- seed.ts
|   +-- migrations/
|
+-- public/
|
+-- .env.example
+-- package.json
+-- README.md
```

> The exact folder structure may vary depending on the current implementation.

---

# 14. Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"

NEXTAUTH_SECRET="your-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional SMTP configuration

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Last-Mile Tracker <your-email@gmail.com>"
```

### Security

Never commit `.env` to source control.

The repository should contain:

```text
.env.example
```

but not:

```text
.env
```

---

# 15. Local Setup

## Prerequisites

Install:

- Node.js
- npm
- Neon PostgreSQL account/database

---

## Clone the Repository

```bash
git clone <repository-url>
cd last-mile-delivery-tracker
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create:

```text
.env
```

using:

```text
.env.example
```

Add your Neon PostgreSQL connection string and authentication secret.

---

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Run Database Migrations

```bash
npx prisma migrate dev --name init
```

---

## Seed the Database

```bash
npm run prisma:seed
```

---

## Start Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# 16. Demo Accounts

The development seed creates demo users.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Password123! |
| Customer | customer@example.com | Password123! |
| Agent | agent.north@example.com | Password123! |
| Agent | agent.south@example.com | Password123! |

These credentials are intended for local development and demonstration purposes only.

For production deployment, use secure credentials and do not expose default passwords.

---

# 17. Useful Commands

### Start Development Server

```bash
npm run dev
```

### Build Application

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Create/Run Prisma Migration

```bash
npm run prisma:migrate
```

### Seed Database

```bash
npm run prisma:seed
```

### Reset Development Database

```bash
npm run db:reset
```

> `db:reset` should only be used during development because it removes and recreates database data.

### Open Prisma Studio

```bash
npx prisma studio
```

---

# 18. API Design

The application follows a REST-style API structure for core operations.

Typical operations include:

```text
Authentication
POST   /api/auth/...

Orders
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id

Order Status
PATCH  /api/orders/:id/status

Assignment
POST   /api/orders/:id/assign
POST   /api/orders/:id/auto-assign

Rescheduling
POST   /api/orders/:id/reschedule

Admin
GET    /api/admin/orders
GET    /api/admin/agents
GET    /api/admin/zones
POST   /api/admin/zones
POST   /api/admin/rate-cards
```

The exact endpoints should match the routes implemented in the application.

All protected endpoints should validate the authenticated user's role before performing privileged operations.

---

# 19. Validation and Error Handling

The application validates user input before processing operations.

Examples include:

- Required address fields
- Positive package dimensions
- Positive package weight
- Valid order type
- Valid payment type
- Valid delivery dates
- Valid order status transitions

API failures should return meaningful errors without exposing internal implementation details.

The frontend should provide clear feedback for:

- Loading states
- Successful operations
- Failed operations
- Validation errors
- Empty data states

---

# 20. Deployment

The application can be deployed using platforms such as:

- Vercel
- Render
- Railway

The production environment requires:

```env
DATABASE_URL="production-neon-connection-string"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://your-production-domain.com"
```

SMTP variables should also be configured if production email notifications are required.

---

# 21. Current MVP Scope and Limitations

The current MVP uses an admin-configured area/postal-code mapping approach for zone detection.

For example:

```text
560001 -> South
400001 -> West
```

This provides deterministic and configurable zone detection without requiring an external geocoding service.

Agent proximity is currently modeled using the agent's configured operational zone/current location information. A production-scale implementation could extend this with real-time GPS coordinates and geospatial queries.

SMS notification support can similarly be connected to a dedicated SMS provider when required.

These choices keep the MVP lightweight while preserving a clear path toward production-scale extensions.

---

# 22. Future Improvements

Potential production enhancements include:

- Real-time GPS-based agent tracking
- Geospatial nearest-agent queries
- Redis-based availability and dispatch queues
- WebSocket-based live tracking
- Advanced delivery analytics and KPIs
- Payment gateway integration
- SMS provider integration
- Rate-card versioning and effective-date management
- Automated retry queues for failed notifications
- Audit logging for administrative actions
- Multi-city and multi-region zone management
- Automated dispatch optimization

---

# 23. Evaluation Highlights

The project is designed around the core requirements of a last-mile logistics platform.

### Configurable Pricing

Pricing is determined dynamically using:

```text
Zone
+
B2B/B2C
+
INTRA/INTER
+
Billable Weight
+
COD
```

### Agent Assignment

Available agents are selected based on their operational location/zone, with support for manual administrative assignment.

### Tracking

Every order status change is stored as a separate tracking-history record.

### Failed Delivery

Failed deliveries support customer notification, rescheduling, and reassignment.

### Role-Based Access

Customers, agents, and administrators have separate capabilities and protected workflows.

---

# 24. Development Notes

The project uses Prisma migrations to keep the database schema synchronized with the application.

During development, Prisma Studio can be used to inspect database records:

```bash
npx prisma studio
```

The database is hosted on Neon PostgreSQL, allowing the application to use a cloud-hosted PostgreSQL database during development and deployment.

---

# 25. License

This project was developed as part of a software engineering / technical assessment and is intended for evaluation and demonstration purposes.
