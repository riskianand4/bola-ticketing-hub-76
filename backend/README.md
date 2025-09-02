# Persiraja Backend

Complete Node.js + Express backend untuk menggantikan Supabase.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
- Install PostgreSQL
- Create database: `persiraja_db`
- Create user dengan akses ke database

### 3. Environment Variables
Copy `.env.example` ke `.env` dan isi dengan konfigurasi Anda:

```bash
cp .env.example .env
```

Edit `.env` dengan database credentials dan API keys Anda.

### 4. Database Migration
```bash
npm run migrate
```

### 5. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile
- PUT `/api/auth/change-password` - Change password

### News
- GET `/api/news` - Get all news
- GET `/api/news/:slug` - Get news by slug
- POST `/api/news` - Create news (admin)
- PUT `/api/news/:id` - Update news (admin)
- DELETE `/api/news/:id` - Delete news (admin)

### Matches
- GET `/api/matches` - Get all matches
- GET `/api/matches/:id` - Get match details
- POST `/api/matches` - Create match (admin)
- PUT `/api/matches/:id` - Update match (admin)
- POST `/api/matches/:id/timer` - Control match timer (admin)

### Tickets
- GET `/api/tickets` - Get available tickets
- POST `/api/tickets/:id/purchase` - Purchase ticket
- GET `/api/tickets/orders/my` - Get user's orders

### Merchandise
- GET `/api/merchandise` - Get merchandise
- POST `/api/merchandise/:id/cart` - Add to cart
- GET `/api/merchandise/cart/items` - Get cart items

### Players
- GET `/api/players` - Get all players
- GET `/api/players/:id` - Get player details

### Gallery
- GET `/api/gallery` - Get gallery items

### Admin Default Login
- Email: admin@persiraja.com
- Password: admin123

## File Upload
Files diupload ke folder `uploads/` dengan struktur:
- `/uploads/avatars/` - User avatars
- `/uploads/news/` - News images
- `/uploads/gallery/` - Gallery images
- `/uploads/merchandise/` - Product images
- `/uploads/players/` - Player photos

## Production Deployment
1. Set `NODE_ENV=production`
2. Configure reverse proxy (nginx)
3. Setup SSL certificate
4. Configure database connection
5. Setup file upload storage (bisa pakai cloud storage)

Backend siap digunakan untuk menggantikan Supabase!