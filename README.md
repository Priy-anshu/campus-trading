# Paper Trading Web App

A full-stack paper trading application that allows users to simulate stock trading with real-time market data from RapidAPI.

## Features

- **Authentication**: JWT-based user registration and login
- **Real-time Stock Data**: Fetch live stock prices from RapidAPI
- **Portfolio Management**: Track holdings, balance, and transactions
- **Trading Simulation**: Buy and sell stocks with simulated money
- **Transaction History**: Complete record of all trading activities
- **Responsive Design**: Modern UI with TailwindCSS
- **Real-time Updates**: Live portfolio tracking and market data

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Token)
- **Stock Data**: RapidAPI
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## Project Structure

```
paper-trading/
├── backend/
│   ├── server.js                 # Main server file
│   ├── routes/                   # API routes
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   ├── stockRoutes.js        # Stock data endpoints
│   │   └── portfolioRoutes.js    # Portfolio management endpoints
│   ├── models/                   # MongoDB models
│   │   ├── User.js               # User model
│   │   ├── Portfolio.js          # Portfolio model
│   │   └── Transaction.js        # Transaction model
│   ├── middlewares/              # Custom middleware
│   │   └── auth.js               # JWT authentication middleware
│   ├── utils/                    # Utility functions
│   │   └── stockApi.js           # RapidAPI integration
│   └── config/                   # Configuration files
├── frontend/
│   ├── src/
│   │   ├── pages/                # React pages
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── Register.jsx      # Registration page
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── Market.jsx        # Stock market browser
│   │   │   ├── Trade.jsx         # Trading interface
│   │   │   └── Portfolio.jsx     # Portfolio management
│   │   ├── components/           # Reusable components
│   │   ├── context/              # React context
│   │   │   └── AuthContext.jsx   # Authentication context
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Utility functions
│   │   │   └── api.js            # API configuration
│   │   └── App.jsx               # Main App component
│   ├── index.html                # HTML template
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite configuration
│   └── tailwind.config.js        # TailwindCSS configuration
├── storage.env                   # Environment variables
├── package.json                  # Root package.json
└── README.md                     # This file
```

## Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (running locally or MongoDB Atlas) - [Download here](https://www.mongodb.com/try/download/community)
- **RapidAPI account** with a stock data API subscription

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd paper-trading

# Install all dependencies (root, backend, and frontend)
npm run install-all
```

### Step 2: Set Up MongoDB

**Option A: Local MongoDB**

```bash
# Install MongoDB locally (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Or start MongoDB manually
mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string

### Step 3: Set Up RapidAPI

1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for a free account
3. Subscribe to a stock data API (e.g., "Latest Stock Price" or "NSE Data")
4. Get your API key and host

### Step 4: Configure Environment Variables

Edit the `storage.env` file with your actual values:

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
MONGO_URI=mongodb://localhost:27017/paper_trading
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/paper_trading

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_make_it_long_and_random

# RapidAPI Configuration
RAPID_API_KEY=your_rapidapi_key_here
RAPID_API_HOST=latest-stock-price.p.rapidapi.com
```

### Step 5: Start the Application

**Option A: Start both servers together**

```bash
npm run dev
```

**Option B: Start servers separately**

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```

### Step 6: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Usage Guide

### 1. Registration and Login

- Navigate to the application
- Click "Create a new account" to register
- Use your email and password to login

### 2. Dashboard Overview

- View your portfolio summary
- Check cash balance and total portfolio value
- See gain/loss statistics
- Browse top gainers and losers

### 3. Browse Market

- Search for stocks by symbol or company name
- View popular stocks with real-time prices
- Click "Trade" to buy or sell stocks

### 4. Trading

- Select a stock to trade
- Choose "Buy" or "Sell"
- Enter the quantity
- Review the order details
- Execute the trade

### 5. Portfolio Management

- View all your holdings
- Track transaction history
- Monitor performance metrics
- Refresh data to get latest prices

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Stock Data

- `GET /api/stocks/:symbol` - Get specific stock details
- `GET /api/stocks/top-gainers` - Get top 5 gainers
- `GET /api/stocks/top-losers` - Get top 5 losers
- `GET /api/stocks/search/:query` - Search stocks

### Portfolio

- `GET /api/portfolio` - View user's portfolio
- `POST /api/portfolio/buy` - Buy stocks
- `POST /api/portfolio/sell` - Sell stocks
- `GET /api/portfolio/history` - View transaction history

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running: `brew services start mongodb/brew/mongodb-community`
   - Check your `MONGO_URI` in `storage.env`
   - For Atlas, ensure your IP is whitelisted

2. **RapidAPI Errors**

   - Verify your API key is correct
   - Check your API quota/usage limits
   - Ensure the API host is correct
   - The app includes mock data fallbacks for development

3. **Port Already in Use**

   - Change the PORT in `storage.env`
   - Kill existing processes: `lsof -ti:5000 | xargs kill -9`

4. **Frontend Not Loading**
   - Check if backend is running on port 5000
   - Verify `VITE_API_URL` in frontend environment
   - Clear browser cache and restart

### Development Tips

1. **Mock Data**: The app includes mock stock data for development when RapidAPI is unavailable
2. **Hot Reload**: Both frontend and backend support hot reload during development
3. **Database Reset**: To reset your portfolio, delete the database and restart
4. **API Testing**: Use tools like Postman to test API endpoints directly

## Production Deployment

### Backend Deployment

1. Set up a production MongoDB instance
2. Use environment variables for configuration
3. Set up proper JWT secrets
4. Configure CORS for your domain
5. Use PM2 or similar for process management

### Frontend Deployment

1. Build the production version: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Update API URLs for production
4. Configure HTTPS for security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Stock Data

- `GET /api/stocks/:symbol` - Get specific stock details
- `GET /api/stocks/top-gainers` - Get top 5 gainers
- `GET /api/stocks/top-losers` - Get top 5 losers

### Portfolio

- `GET /api/portfolio` - View user's portfolio
- `POST /api/portfolio/buy` - Buy stocks
- `POST /api/portfolio/sell` - Sell stocks
- `GET /api/portfolio/history` - View transaction history

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **View Market**: Browse available stocks and their current prices
3. **Trade**: Buy and sell stocks using your simulated $100,000 starting balance
4. **Track Portfolio**: Monitor your holdings, balance, and performance
5. **View History**: Review all your trading transactions

## Notes

- Starting balance: $100,000 (simulated)
- All stock prices are fetched in real-time from RapidAPI
- Transactions are stored in MongoDB for persistence
- JWT tokens are used for secure authentication

## Troubleshooting

- Ensure MongoDB is running
- Verify your RapidAPI key is valid and has sufficient quota
- Check that all environment variables are properly set
- Make sure ports 5000 and 5173 are available
