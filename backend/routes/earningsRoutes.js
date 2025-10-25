import { Router } from 'express';
import earningsService from '../services/EarningsService.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * GET /api/earnings/user
 * Get current user's earnings
 */
router.get('/user', authRequired, (req, res) => {
  try {
    const userId = req.userId;
    const earnings = earningsService.getEarnings(userId);
    
    if (!earnings) {
      return res.status(404).json({ 
        success: false, 
        message: 'User earnings not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        userId: userId,
        dayEarning: earnings.dayEarning,
        monthEarning: earnings.monthEarning,
        overallEarning: earnings.overallEarning,
        lastDayEarning: earnings.lastDayEarning,
        lastMonthEarning: earnings.lastMonthEarning,
        currentPortfolioValue: earnings.currentPortfolioValue,
        lastPortfolioValue: earnings.lastPortfolioValue
      }
    });
    
  } catch (error) {
    console.error('Error fetching user earnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching earnings' 
    });
  }
});

/**
 * GET /api/earnings/leaderboard
 * Get leaderboard data (all users' earnings)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { period = 'overall' } = req.query;
    const leaderboard = await earningsService.getLeaderboard(period);
    
    res.json({
      success: true,
      data: leaderboard,
      period: period
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching leaderboard' 
    });
  }
});

/**
 * POST /api/earnings/update
 * Update earnings for a user (called when transactions occur)
 */
router.post('/update', authRequired, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;
    
    if (typeof amount !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be a number' 
      });
    }
    
    // Update earnings in service
    await earningsService.updateEarnings(userId, amount);
    
    // Get updated earnings
    const updatedEarnings = earningsService.getEarnings(userId);
    
    res.json({
      success: true,
      message: 'Earnings updated successfully',
      data: {
        userId: userId,
        amount: amount,
        dayEarning: updatedEarnings.dayEarning,
        monthEarning: updatedEarnings.monthEarning,
        overallEarning: updatedEarnings.overallEarning,
        lastDayEarning: updatedEarnings.lastDayEarning,
        lastMonthEarning: updatedEarnings.lastMonthEarning
      }
    });
    
  } catch (error) {
    console.error('Error updating earnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating earnings' 
    });
  }
});

/**
 * POST /api/earnings/force-update-db
 * Force update database with current cache values
 */
router.post('/force-update-db', async (req, res) => {
  try {
    await earningsService.forceUpdateDatabase();
    
    res.json({
      success: true,
      message: 'Database updated successfully'
    });
    
  } catch (error) {
    console.error('Error force updating database:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating database' 
    });
  }
});

/**
 * GET /api/earnings/stats
 * Get system statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = earningsService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching system stats' 
    });
  }
});

/**
 * POST /api/earnings/add-user
 * Add a new user to the earnings system
 */
router.post('/add-user', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    
    if (!userId || !userName) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and userName are required' 
      });
    }
    
    await earningsService.addUser(userId, userName);
    
    res.json({
      success: true,
      message: 'User added to earnings system successfully'
    });
    
  } catch (error) {
    console.error('Error adding user to earnings system:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding user to earnings system' 
    });
  }
});

/**
 * GET /api/earnings/portfolio-data
 * Get comprehensive portfolio data for frontend
 */
router.get('/portfolio-data', authRequired, async (req, res) => {
  try {
    const userId = req.userId;
    const earnings = earningsService.getEarnings(userId);
    
    if (!earnings) {
      return res.status(404).json({ 
        success: false, 
        message: 'User earnings not found' 
      });
    }
    
    // Calculate returns
    const oneDayReturn = earnings.lastPortfolioValue > 0 
      ? ((earnings.currentPortfolioValue - earnings.lastPortfolioValue) / earnings.lastPortfolioValue) * 100 
      : 0;
    
    const monthlyReturn = earnings.lastMonthEarning > 0 
      ? ((earnings.monthEarning - earnings.lastMonthEarning) / Math.abs(earnings.lastMonthEarning)) * 100 
      : 0;
    
    res.json({
      success: true,
      data: {
        userId: userId,
        currentPortfolioValue: earnings.currentPortfolioValue,
        lastPortfolioValue: earnings.lastPortfolioValue,
        dayEarning: earnings.dayEarning,
        monthEarning: earnings.monthEarning,
        overallEarning: earnings.overallEarning,
        lastDayEarning: earnings.lastDayEarning,
        lastMonthEarning: earnings.lastMonthEarning,
        oneDayReturn: oneDayReturn,
        monthlyReturn: monthlyReturn
      }
    });
    
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching portfolio data' 
    });
  }
});

export default router;