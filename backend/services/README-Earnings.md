# Earnings System

A simple and efficient backend solution for calculating daily, monthly, and overall earnings with in-memory caching.

## Features

- ✅ **Daily Earnings**: Sum of all transactions between 12:00 AM to 11:59 PM IST
- ✅ **Monthly Earnings**: Sum of all daily earnings in the current month
- ✅ **Overall Earnings**: Sum of all earnings (never resets)
- ✅ **Auto Reset**: Daily earnings reset at midnight, monthly at start of month
- ✅ **14-minute Database Updates**: Automatic persistence every 14 minutes
- ✅ **Cache Restoration**: Restores from database on server restart
- ✅ **Fast Access**: In-memory cache for instant calculations

## Quick Start

### 1. Initialize the System

The earnings cache is automatically initialized when the server starts:

```javascript
// Already integrated in server.js
await earningsCache.initialize();
```

### 2. Update Earnings

Use the simple utility function anywhere in your backend:

```javascript
import { updateEarnings } from "../utils/earningsUtils.js";

// When a user makes a profitable trade
updateEarnings(userId, 150.5);

// When a user makes a losing trade
updateEarnings(userId, -75.25);
```

### 3. Get Earnings

```javascript
import { getEarnings } from "../utils/earningsUtils.js";

const earnings = getEarnings(userId);
console.log(earnings.dailyEarning); // Today's earnings
console.log(earnings.monthlyEarning); // This month's earnings
console.log(earnings.overallEarning); // Total earnings
```

## API Endpoints

### Get User Earnings

```http
GET /api/earnings/user
Authorization: Bearer <token>
```

### Get Leaderboard

```http
GET /api/earnings/leaderboard?period=daily|monthly|overall
```

### Update Earnings

```http
POST /api/earnings/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 150.50
}
```

### Force Database Update

```http
POST /api/earnings/force-update-db
```

### Get Cache Statistics

```http
GET /api/earnings/stats
```

## Integration Examples

### In Transaction Routes

```javascript
// In your buy/sell routes
import { updateEarnings } from "../utils/earningsUtils.js";

router.post("/buy", authRequired, async (req, res) => {
  // ... your existing buy logic ...

  // Calculate profit/loss
  const profit = calculateProfit(purchasePrice, currentPrice, quantity);

  // Update earnings
  updateEarnings(userId, profit);

  // ... rest of your response ...
});
```

### In User Registration

```javascript
// In your registration route
import { addUserToEarnings } from "../utils/earningsUtils.js";

router.post("/register", async (req, res) => {
  // ... your existing registration logic ...

  const user = await User.create(userData);

  // Add user to earnings system
  addUserToEarnings(user._id, user.name);

  // ... rest of your response ...
});
```

## How It Works

### 1. Cache System

- **In-Memory Storage**: Fast access using JavaScript Map
- **Auto-Reset Logic**: Checks for daily/monthly resets on every access
- **Persistent Updates**: Saves to database every 14 minutes

### 2. Reset Logic

- **Daily Reset**: At 12:00 AM IST, daily earnings reset to 0
- **Monthly Reset**: At start of new month, monthly earnings reset to 0
- **Overall Earnings**: Never reset, always accumulate

### 3. Database Integration

- **User Model**: Uses existing `dailyProfit`, `monthlyProfit`, `totalProfit` fields
- **Automatic Sync**: Every 14 minutes, cache values are saved to database
- **Restart Recovery**: On server restart, loads all user data from database

## Performance

- ⚡ **Instant Access**: In-memory cache provides sub-millisecond response times
- 🔄 **Efficient Updates**: Only updates database every 14 minutes
- 💾 **Memory Efficient**: Minimal memory footprint
- 🚀 **Scalable**: Handles thousands of users efficiently

## Error Handling

The system includes comprehensive error handling:

- Graceful fallbacks for cache failures
- Database connection error recovery
- User not found scenarios
- Invalid amount validation

## Monitoring

Use the stats endpoint to monitor the system:

```javascript
const stats = getCacheStats();
console.log(stats);
// {
//   isInitialized: true,
//   userCount: 150,
//   hasUpdateInterval: true
// }
```

## Best Practices

1. **Always use the utility functions** instead of direct cache access
2. **Update earnings immediately** when transactions occur
3. **Handle errors gracefully** in your transaction logic
4. **Monitor cache stats** in production
5. **Use force-update-db** for manual database sync if needed

## Troubleshooting

### Cache Not Initialized

```javascript
const stats = getCacheStats();
if (!stats.isInitialized) {
  console.log("Earnings cache not initialized");
}
```

### Force Database Update

```javascript
import { forceUpdateDatabase } from "../utils/earningsUtils.js";
await forceUpdateDatabase();
```

### Add Missing User

```javascript
import { addUserToEarnings } from "../utils/earningsUtils.js";
addUserToEarnings(userId, userName);
```
