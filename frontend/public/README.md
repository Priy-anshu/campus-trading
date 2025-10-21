 HEAD
# Campus Exchange - Stock Trading Dashboard

A React/TypeScript application with JWT authentication for stock trading and portfolio management.

## Features

✅ **JWT Authentication**
- Login and registration with mock JWT tokens
- Protected routes that require authentication
- Automatic redirect to login for unauthenticated users
- Logout functionality that clears tokens

✅ **Routing**
- React Router v6 implementation
- Protected routes for dashboard, portfolio, and orders
- Public routes for login and registration

✅ **UI Components**
- Modern UI with Tailwind CSS and shadcn/ui
- Responsive design
- Toast notifications for user feedback

## Project Structure

```
src/
├── pages/
│   ├── Login.tsx          # Login page
│   ├── Register.tsx       # Registration page
│   ├── Dashboard.tsx     # Main dashboard (protected)
│   ├── Index.tsx         # Portfolio page (protected)
│   ├── StockDetails.tsx  # Stock details (protected)
│   └── StockActivityHistory.tsx # Orders page (protected)
├── components/
│   ├── ProtectedRoute.tsx # Route protection component
│   └── Navbar.tsx        # Navigation with logout
├── services/
│   └── authService.ts    # Authentication service
└── utils/
    └── token.ts          # Token utility functions
```

## Authentication Flow

1. **Unauthenticated users** are redirected to `/login`
2. **Login/Register** pages are publicly accessible
3. **After successful login**, users are redirected to `/dashboard`
4. **All dashboard routes** are protected and require authentication
5. **Logout** clears the JWT token and redirects to login

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   # or
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Mock Authentication

The application currently uses mock JWT tokens for demonstration purposes. To integrate with a real backend:

1. Update `API_BASE_URL` in `src/services/authService.ts`
2. Replace mock API calls with actual endpoints
3. Update token validation logic in `src/utils/token.ts`

## Available Scripts

- `npm start` - Start development server
- `npm run dev` - Start development server (alias)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

# 📈 Paper Trading App

A full-stack **paper trading platform** where users can simulate stock trades using real-time market data without using real money.

---

## 🚀 Features
- User authentication (register/login)
- View live stock prices (via RapidAPI)
- Buy and sell virtual stocks
- Track portfolio and transactions
- Backend: Node.js, Express, MongoDB
- Frontend: React (to be added)

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/priy-anshu/paper-trading.git
cd paper-trading