# Banka Backend

Production-grade backend for Banka, a Rwanda-based Financial Advisory Platform.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** ExpressJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + Refresh Tokens
- **Validation:** Zod
- **Documentation:** Swagger/OpenAPI
- **Deployment:** Docker

## Architecture

```
Controller → Application Service → Domain Service → Repository → Prisma → PostgreSQL
```

Direct database access from controllers is strictly forbidden.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/banka
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
CORS_ORIGIN=http://localhost:3000
```

### Docker Setup

```bash
docker-compose up -d
```

## Default Accounts

| Role             | Email                | Password  |
|------------------|----------------------|-----------|
| Platform Admin   | admin@banka.rw       | Admin@123 |
| Finance Officer  | finance@banka.rw     | Admin@123 |
| Financial Advisor| advisor@banka.rw     | Admin@123 |
| Client       | client@banka.rw  | Admin@123 |

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/refresh-token` - Refresh JWT
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Subscriptions
- `GET /api/subscriptions` - List subscriptions
- `GET /api/subscriptions/my` - My subscription
- `GET /api/subscriptions/:id` - Get subscription
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription

### Advisors
- `GET /api/advisors` - List advisors
- `GET /api/advisors/:id` - Get advisor
- `POST /api/advisors` - Create advisor (Finance/Admin)
- `PUT /api/advisors/:id` - Update advisor
- `DELETE /api/advisors/:id` - Delete advisor

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments/assign` - Assign client to advisor
- `POST /api/assignments/:id/end` - End assignment

### Goals
- `GET /api/goals` - List goals
- `GET /api/goals/my` - My goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `PATCH /api/goals/:id/progress` - Update progress
- `DELETE /api/goals/:id` - Delete goal

### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting
- `PATCH /api/meetings/:id/status` - Update status
- `DELETE /api/meetings/:id` - Delete meeting

### Notifications
- `GET /api/notifications` - My notifications
- `GET /api/notifications/unread-count` - Unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Analytics (Admin/Finance)
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/revenue-by-plan` - Revenue breakdown
- `GET /api/analytics/monthly-revenue` - Monthly trend
- `GET /api/analytics/advisor-capacity` - Capacity stats
- `GET /api/analytics/goal-completion-rate` - Goal completion

### Settings
- `GET /api/settings/profile` - Get profile
- `PUT /api/settings/profile` - Update profile
- `PUT /api/settings/password` - Change password
