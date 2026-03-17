# Bucketlist Bookstore

An independent bookstore web application featuring user authentication, book catalog management, shopping cart functionality, and secure payment processing.

## Project Overview

Bucketlist Bookstore is a full-stack e-commerce application built with modern web technologies. The platform allows users to browse and purchase books, while administrators can manage the catalog, genres, orders, and user accounts.

## Tech Stack

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.2.x
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet.js, bcryptjs, rate limiting
- **File Storage**: Cloudinary
- **Payment Gateway**: Razorpay
- **Validation**: Zod
- **Logging**: Pino

### Frontend

- **Framework**: React 18.3.x with TypeScript
- **Build Tool**: Vite 5.4.x
- **Styling**: Tailwind CSS 4.2.x
- **State Management**: Zustand
- **Server State**: TanStack React Query
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Prerequisites

Before setting up the project, ensure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- PostgreSQL (v16 or higher)
- Docker and Docker Compose (for containerized setup)

## Project Structure

```
bookstore/
├── backend/              # Express.js backend API
│   ├── src/
│   │   ├── app.ts       # Express app configuration
│   │   ├── server.ts    # Server entry point
│   │   ├── auth/        # Authentication module
│   │   ├── config/      # Configuration files (env, logger, etc.)
│   │   ├── lib/         # Utility libraries
│   │   ├── middleware/  # Express middleware
│   │   ├── modules/     # Feature modules (books, cart, orders, etc.)
│   │   └── types/       # TypeScript type definitions
│   ├── prisma/          # Database schema and migrations
│   ├── .env.example     # Environment variables template
│   └── package.json
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/         # API client functions
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── router/      # Route definitions
│   │   ├── store/       # Zustand state stores
│   │   ├── types/       # TypeScript types
│   │   └── assets/      # Static assets
│   ├── vite.config.ts
│   └── package.json
├── docs/                # API documentation
│   └── postman.test.json # Postman test suite
├── docker-compose.yml   # Docker Compose configuration
└── README.md

```

## Installation

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file by copying the example:

   ```bash
   cp .env.example .env
   ```

4. Configure the `.env` file with your values:

   ```
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookstore
   JWT_ACCESS_SECRET=your_long_random_secret_min_32_chars
   JWT_REFRESH_SECRET=your_long_random_secret_min_32_chars
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   CORS_ORIGIN=http://localhost:5173
   ```

5. Set up the database:
   - Ensure PostgreSQL is running and accessible
   - Run Prisma migrations:
     ```bash
     npx prisma migrate dev
     ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file with API configuration (if needed):

   ```
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

5. To build for production:
   ```bash
   npm run build
   ```

## Docker Setup

To run the entire application using Docker Compose:

1. Ensure Docker and Docker Compose are installed

2. From the root directory, run:
   ```bash
   docker-compose up -d
   ```

This will start:

- PostgreSQL database on port 5432
- Backend API on port 3000
- Frontend on port 80

To stop the containers:

```bash
docker-compose down
```

To view logs:

```bash
docker-compose logs -f [service-name]
```

## Environment Variables

### Backend Environment Variables

| Variable                 | Description           | Example                                           |
| ------------------------ | --------------------- | ------------------------------------------------- |
| `PORT`                   | Server port           | `3000`                                            |
| `NODE_ENV`               | Environment           | `development` or `production`                     |
| `DATABASE_URL`           | PostgreSQL connection | `postgresql://user:pass@localhost:5432/bookstore` |
| `JWT_ACCESS_SECRET`      | JWT signing secret    | Min 32 characters                                 |
| `JWT_REFRESH_SECRET`     | JWT refresh secret    | Min 32 characters                                 |
| `JWT_ACCESS_EXPIRES_IN`  | Access token expiry   | `15m`                                             |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry  | `7d`                                              |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary account    | From Cloudinary dashboard                         |
| `CLOUDINARY_API_KEY`     | Cloudinary API key    | From Cloudinary dashboard                         |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret | From Cloudinary dashboard                         |
| `RAZORPAY_KEY_ID`        | Razorpay public key   | From Razorpay dashboard                           |
| `RAZORPAY_KEY_SECRET`    | Razorpay secret key   | From Razorpay dashboard                           |
| `CORS_ORIGIN`            | CORS allowed origin   | `http://localhost:5173`                           |

### Frontend Environment Variables

| Variable               | Description         | Example                        |
| ---------------------- | ------------------- | ------------------------------ |
| `VITE_API_URL`         | Backend API URL     | `http://localhost:3000/api/v1` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key | From Razorpay dashboard        |

## API Documentation

API endpoints are documented in the `docs/postman.test.json` file. This Postman collection includes:

- Authentication endpoints (login, register, token refresh)
- Book catalog operations
- Genre management
- Shopping cart operations
- Order processing
- Payment integration
- Admin operations for books, genres, and user management

To test the API:

1. Import `docs/postman.test.json` into Postman
2. Set the base URL to `http://localhost:3000/api/v1`
3. Use the predefined requests to test all API endpoints

## Key Features

### User Features

- User registration and authentication with JWT tokens
- Browse book catalog with filtering and search
- View detailed book information
- Shopping cart management
- Secure checkout with Razorpay payment integration
- Order tracking and history
- User profile management

### Admin Features

- Dashboard with overview statistics
- Book catalog management (create, read, update, delete)
- Genre management
- Order management and tracking
- User management
- Payment monitoring

### Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- CORS protection
- Security headers with Helmet.js
- Zod schema validation
- Environment variable protection

## Database

The application uses PostgreSQL with Prisma ORM. The database schema includes:

- **User**: User accounts with roles (USER, ADMIN)
- **Book**: Book catalog with pricing and inventory
- **Genre**: Book categories and classifications
- **Cart**: Shopping cart items per user
- **Order**: Purchase orders with status tracking
- **Payment**: Payment transaction records
- **RefreshToken**: JWT refresh token management

### Database Migrations

To create a new migration:

```bash
npx prisma migrate dev --name migration_name
```

To run migrations:

```bash
npx prisma migrate deploy
```

## Development

### Backend Development

- Code changes auto-reload with `npm run dev`
- Use TypeScript for type safety
- Follow the modular structure in the `modules/` directory
- Create new routes in the appropriate module folder

### Frontend Development

- Hot Module Replacement (HMR) enabled by default
- TypeScript strict mode enabled
- ESLint configured for code quality
- Tailwind CSS for utility-first styling

Run linting:

```bash
npm run lint
```

## Notes

- The backend uses Express.js v5.x (latest version)
- Prisma adapter for PostgreSQL provides optimized database access
- The frontend uses Vite for fast development and optimized production builds
- CORS is configured to allow the frontend origin
- Rate limiting middleware is available but currently disabled for development

## Support

For issues or questions about the project setup, refer to the configuration files or check the documentation in the docs folder.
