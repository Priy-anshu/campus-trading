# 🏛️ Campus Trading - Paper Trading Platform

A comprehensive full-stack paper trading application designed for educational purposes, allowing users to simulate real stock trading with live market data, portfolio management, and competitive leaderboards.

## ✨ Features

### 🔐 Authentication & User Management

- **Secure Registration/Login**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Complete user information with mobile numbers, date of birth, and gender
- **Session Management**: Persistent login with secure token handling

### 📊 Real-time Market Data

- **Live Stock Prices**: Real-time data from external APIs with automatic updates
- **Market Ticker**: Animated scrolling ticker with customizable restart time (default: 20 minutes)
- **Stock Search**: Advanced search functionality with symbol and company name lookup
- **Top Movers**: Live tracking of gainers and losers
- **Most Traded**: Popular stocks with volume data

### 💼 Portfolio Management

- **Holdings Dashboard**: Complete portfolio overview with current values
- **Transaction History**: Detailed record of all buy/sell transactions
- **Performance Tracking**: Real-time P&L calculations and performance metrics
- **Watchlist**: Personal stock watchlist with price alerts
- **Daily/Monthly/Overall Returns**: Comprehensive profit tracking

### 🏆 Competitive Features

- **Leaderboard System**: Daily, monthly, and overall rankings
- **User Rankings**: Individual performance tracking
- **Profit Calculations**: Automated daily and monthly profit updates
- **Cron Jobs**: Scheduled resets for daily and monthly competitions

### 📱 Responsive Design

- **Mobile-First**: Optimized for all device sizes
- **Modern UI**: Clean, intuitive interface with TailwindCSS
- **Dark/Light Theme**: Adaptive theming support
- **Mobile Search**: Dedicated mobile search functionality

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests
- **Helmet** for security
- **Morgan** for logging
- **Node-cron** for scheduled tasks

### Database Models

- **User**: User profiles and authentication
- **Portfolio**: Stock holdings and transactions
- **Order**: Trading orders and history
- **Leaderboard**: Competitive rankings
- **DailyProfit**: Daily profit tracking
- **Earnings**: Comprehensive earnings system

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas)
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd campus-trading
```

2. **Install dependencies**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Set up environment variables**

Create `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/campus_trading
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

4. **Start MongoDB**

```bash
# For local MongoDB
mongod --dbpath /usr/local/var/mongodb

# Or use MongoDB Atlas (cloud)
```

5. **Start the application**

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run dev
```

6. **Access the application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 📁 Project Structure

```
campus-trading/
├── backend/
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── portfolioController.js
│   │   ├── stockController.js
│   │   └── leaderboardController.js
│   ├── models/              # Database models
│   │   ├── User.js
│   │   ├── Portfolio.js
│   │   ├── Order.js
│   │   └── Leaderboard.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── portfolioRoutes.js
│   │   ├── stockRoutes.js
│   │   └── leaderboardRoutes.js
│   ├── services/            # Business logic
│   │   ├── StockCache.js
│   │   ├── portfolioService.js
│   │   └── DailyProfitService.js
│   ├── utils/               # Utility functions
│   │   ├── response.js
│   │   ├── validation.js
│   │   └── timeUtils.js
│   ├── server.js            # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Dashboard/
│   │   │   ├── Portfolio/
│   │   │   └── WatchList/
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   └── Watchlist.tsx
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── PRODUCTION_READINESS.md  # Production deployment guide
├── backend/render.yaml       # Render.com deployment config
├── frontend/netlify.toml    # Netlify deployment config
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user
- `PUT /api/auth/change-password` - Change password

### Stock Data

- `GET /api/stocks/all` - Get all stocks
- `GET /api/stocks/gainers` - Top gainers
- `GET /api/stocks/losers` - Top losers
- `GET /api/stocks/search?symbol=SYMBOL` - Search stocks

### Portfolio

- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/buy` - Buy stocks
- `POST /api/portfolio/sell` - Sell stocks
- `GET /api/portfolio/history` - Transaction history

### Leaderboard

- `GET /api/leaderboard?period=day` - Daily leaderboard
- `GET /api/leaderboard?period=month` - Monthly leaderboard
- `GET /api/leaderboard?period=overall` - Overall leaderboard

### Orders

- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order

## 🎯 Usage Guide

### 1. Getting Started

1. **Register**: Create a new account with your details
2. **Login**: Access your trading dashboard
3. **Explore**: Browse the market and available stocks

### 2. Trading

1. **Search Stocks**: Use the search bar to find stocks
2. **View Details**: Click on stocks to see detailed information
3. **Place Orders**: Buy or sell stocks with specified quantities
4. **Track Performance**: Monitor your portfolio in real-time

### 3. Portfolio Management

1. **View Holdings**: See all your current stock positions
2. **Check Balance**: Monitor your available cash
3. **Track Performance**: View daily, monthly, and overall returns
4. **Transaction History**: Review all your trading activities

### 4. Competition

1. **Leaderboard**: Check your ranking against other users
2. **Performance Metrics**: Track your profit/loss over time
3. **Daily/Monthly Resets**: Compete in different time periods

## 🚀 Production Deployment

### Backend (Render.com)

1. Connect your GitHub repository to Render
2. Use the provided `backend/render.yaml` configuration
3. Set environment variables in Render dashboard
4. Deploy automatically on git push

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Use the provided `frontend/netlify.toml` configuration
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### Environment Variables

**Backend (Production):**

```env
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campus_trading
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
```

**Frontend (Production):**

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

## 🔒 Security Features

- **Helmet.js**: HTTP security headers
- **CORS**: Cross-origin resource sharing configuration
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against brute force attacks

## 📊 Performance Features

- **Stock Caching**: In-memory cache for fast stock data access
- **Database Indexing**: Optimized MongoDB queries
- **Code Splitting**: Frontend bundle optimization
- **Lazy Loading**: Component-based lazy loading
- **Cron Jobs**: Automated data updates and resets

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   ```bash
   # Start MongoDB locally
   mongod --dbpath /usr/local/var/mongodb

   # Or check Atlas connection string
   ```

2. **Port Already in Use**

   ```bash
   # Kill process on port 4000
   lsof -ti:4000 | xargs kill -9
   ```

3. **Module Import Errors**

   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Frontend Build Issues**
   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite
   npm run dev
   ```

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **Mock Data**: Fallback data when external APIs are unavailable
3. **Database Reset**: Clear database for fresh start
4. **API Testing**: Use tools like Postman for API testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **RapidAPI** for stock market data
- **MongoDB Atlas** for cloud database hosting
- **Render.com** for backend hosting
- **Netlify** for frontend hosting
- **TailwindCSS** for styling framework
- **React** and **Node.js** communities

## 📞 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

---

**Happy Trading! 📈**
