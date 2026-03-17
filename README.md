# 📚 BucketList Bookstore

> _Read before you go._

A full-stack, production-ready e-commerce platform for book listings. Built with Node.js, TypeScript, React, and PostgreSQL — featuring real payment processing, image uploads, atomic order transactions, and a complete admin dashboard.

**Live Demo:** [bucketlistbookstore.vercel.app](https://bucketlistbookstore.vercel.app)

---

## Screenshots

> Add screenshots here after deployment is stable.

---

## Tech Stack

| Layer             | Technology                            |
| ----------------- | ------------------------------------- |
| Backend Runtime   | Node.js + TypeScript                  |
| Backend Framework | Express.js                            |
| ORM               | Prisma                                |
| Database          | PostgreSQL                            |
| Authentication    | JWT (Access + Refresh Token Rotation) |
| Validation        | Zod                                   |
| Payments          | Razorpay                              |
| Image Uploads     | Cloudinary                            |
| Logging           | Pino                                  |
| Security          | Helmet.js + express-rate-limit        |
| Containerization  | Docker + docker-compose               |
| Frontend          | React + TypeScript + Tailwind CSS     |
| Server State      | TanStack React Query                  |
| Client State      | Zustand                               |
| Routing           | React Router v6                       |

---

## Features

### Storefront

- Browse books with search, genre filters, and price range filters
- Full-text search across title, author, and description
- Book detail page with stock status
- Add to cart with quantity management
- Checkout with shipping address form
- Real payment processing via Razorpay (test mode)
- Order history and order detail pages
- Cancel orders (PENDING or CONFIRMED only)

### Authentication

- Register and login with email + password
- JWT access tokens (15 min TTL)
- Refresh token rotation with server-side invalidation
- HttpOnly cookie for refresh token storage
- Secure logout that invalidates server-side token

### Admin Dashboard

- Manage books — create, update, delete, update stock
- Upload book cover images via Cloudinary
- Manage genres — create and delete
- View all orders across all users
- Update order status (CONFIRMED → SHIPPED → DELIVERED)
- View and manage users

### Production-Grade

- Atomic order placement with row-level locking (stock never goes negative)
- Price snapshot on OrderItems (historical accuracy)
- Zod validation on every endpoint
- Centralized error handler with consistent response shape
- Rate limiting — 10 req/15min on auth, 100 req/15min globally
- Structured JSON logging with Pino
- Env validation on startup (app refuses to start with missing config)
- Docker + docker-compose for local development

---

## Project Structure

```
bookstore/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # Env, logger, Razorpay config
│   │   ├── middleware/        # Auth, error handler, rate limiter, validation
│   │   ├── modules/          # Feature modules (auth, books, cart, orders, etc.)
│   │   ├── lib/              # Prisma client, Cloudinary helpers, AppError
│   │   └── types/            # Express type augmentations
│   └── prisma/
│       ├── schema.prisma     # 9-table database schema
│       └── migrations/       # Migration history
├── frontend/                 # React + Tailwind storefront
│   └── src/
│       ├── api/              # Axios instance + all API functions
│       ├── components/       # Reusable UI and layout components
│       ├── pages/            # Storefront, admin, and auth pages
│       ├── store/            # Zustand auth store
│       ├── hooks/            # React Query hooks
│       └── types/            # Shared TypeScript types
└── docs/
    └── bookstore.postman_collection.json
```

---

## API Endpoints

| Method | Endpoint                        | Auth   | Description                |
| ------ | ------------------------------- | ------ | -------------------------- |
| POST   | /api/v1/auth/register           | Public | Register new user          |
| POST   | /api/v1/auth/login              | Public | Login + set refresh cookie |
| POST   | /api/v1/auth/refresh            | Public | Rotate refresh token       |
| POST   | /api/v1/auth/logout             | User   | Invalidate refresh token   |
| GET    | /api/v1/auth/me                 | User   | Get current user           |
| GET    | /api/v1/books                   | Public | List books with filters    |
| GET    | /api/v1/books/:id               | Public | Get single book            |
| POST   | /api/v1/books                   | Admin  | Create book with image     |
| PUT    | /api/v1/books/:id               | Admin  | Update book                |
| DELETE | /api/v1/books/:id               | Admin  | Delete book                |
| PATCH  | /api/v1/books/:id/stock         | Admin  | Update stock               |
| GET    | /api/v1/genres                  | Public | List genres                |
| POST   | /api/v1/admin/genres            | Admin  | Create genre               |
| DELETE | /api/v1/admin/genres/:id        | Admin  | Delete genre               |
| GET    | /api/v1/cart                    | User   | Get cart                   |
| POST   | /api/v1/cart/items              | User   | Add item to cart           |
| PATCH  | /api/v1/cart/items/:bookId      | User   | Update quantity            |
| DELETE | /api/v1/cart/items/:bookId      | User   | Remove item                |
| POST   | /api/v1/orders                  | User   | Place order                |
| GET    | /api/v1/orders                  | User   | Order history              |
| GET    | /api/v1/orders/:id              | User   | Order detail               |
| POST   | /api/v1/orders/:id/cancel       | User   | Cancel order               |
| POST   | /api/v1/payments/verify         | User   | Verify Razorpay payment    |
| GET    | /api/v1/admin/orders            | Admin  | All orders                 |
| PATCH  | /api/v1/admin/orders/:id/status | Admin  | Update order status        |
| GET    | /api/v1/admin/users             | Admin  | List users                 |
| GET    | /api/v1/admin/users/:id         | Admin  | User detail                |
| DELETE | /api/v1/admin/users/:id         | Admin  | Delete user                |

Full API reference with request/response shapes is available in the Postman collection.

---

## Running Locally

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- A Cloudinary account (free tier)
- A Razorpay account (test keys)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/bookstore
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Generate JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run migrations and start:

```bash
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

Start:

```bash
npm run dev
```

### Docker (Backend + Database)

```bash
# From root bookstore/ directory
docker-compose up
```

This spins up PostgreSQL and the backend together. Migrations run automatically on startup.

---

## Testing the API

Import `docs/bookstore.postman_collection.json` into Postman.

The collection:

- Auto-saves tokens after login
- Chains IDs between requests (genre ID → book creation → cart → order)
- Includes test assertions for expected status codes
- Covers all 30+ endpoints in order

To test payments in Razorpay test mode use:

- Card: `4100 2800 0000 1007`
- Expiry: any future date
- CVV: any 3 digits
- OTP: `1234`

---

## Database Schema

9 tables: `User`, `RefreshToken`, `Genre`, `Book`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`

Key design decisions:

- `priceAtPurchase` on OrderItem — price snapshot at time of purchase, unaffected by future price changes
- `tokenHash` on RefreshToken — tokens stored as SHA-256 hashes, never plaintext
- `shippingAddress` as JSON on Order — snapshot at time of order, independent of user changes
- Atomic order placement using Prisma interactive transactions with row-level locking

---

## Deployment

| Service  | Platform          |
| -------- | ----------------- |
| Frontend | Vercel            |
| Backend  | Render            |
| Database | Render PostgreSQL |
| Images   | Cloudinary CDN    |

---

## License

MIT
