import { Router } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authRequired);

// Get all orders for a user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, symbol, orderType } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { user: req.userId };
    if (symbol) filter.symbol = { $regex: symbol, $options: 'i' };
    if (orderType) filter.orderType = orderType;
    
    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: orders.length,
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    
    // Convert userId to ObjectId if it's a string
    const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    
    const stats = await Order.aggregate([
      { $match: { user: objectId } },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);
    
    const totalOrders = await Order.countDocuments({ user: objectId });
    const totalBuyAmount = stats.find(s => s._id === 'buy')?.totalAmount || 0;
    const totalSellAmount = stats.find(s => s._id === 'sell')?.totalAmount || 0;
    
    res.json({
      totalOrders,
      totalBuyAmount,
      totalSellAmount,
      netAmount: totalSellAmount - totalBuyAmount,
      buyOrders: stats.find(s => s._id === 'buy')?.count || 0,
      sellOrders: stats.find(s => s._id === 'sell')?.count || 0
    });
  } catch (error) {
    console.error('Order stats error:', error);
    res.status(500).json({ message: 'Failed to fetch order stats', error: error.message });
  }
});

// Get orders by symbol
router.get('/symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ 
      user: req.userId, 
      symbol: symbol.toUpperCase() 
    })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Order.countDocuments({ 
      user: req.userId, 
      symbol: symbol.toUpperCase() 
    });
    
    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: orders.length,
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders for symbol', error: error.message });
  }
});

export default router;
