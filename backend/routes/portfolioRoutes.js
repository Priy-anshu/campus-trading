import { Router } from 'express';
import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.userId });
  const user = await User.findById(req.userId).select('walletBalance');
  if (!portfolio || !user) return res.status(404).json({ message: 'Portfolio not found' });
  res.json({ holdings: portfolio.holdings, walletBalance: user.walletBalance });
});

router.put('/fund', async (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.walletBalance += amount;
  await user.save();
  res.json({ walletBalance: user.walletBalance });
});

router.post('/buy', async (req, res) => {
  const { symbol, quantity, price, orderCategory = 'delivery' } = req.body;
  if (!symbol || !quantity || !price) return res.status(400).json({ message: 'Missing fields' });
  if (quantity <= 0 || price <= 0) return res.status(400).json({ message: 'Invalid values' });

  const user = await User.findById(req.userId);
  const portfolio = await Portfolio.findOne({ user: req.userId });
  if (!user || !portfolio) return res.status(404).json({ message: 'Portfolio not found' });

  const cost = quantity * price;
  if (user.walletBalance < cost) return res.status(400).json({ message: 'Insufficient funds' });

  user.walletBalance -= cost;

  const existing = portfolio.holdings.find(h => h.symbol === symbol);
  if (existing) {
    const totalQty = existing.quantity + quantity;
    const newAvg = (existing.avgPrice * existing.quantity + price * quantity) / totalQty;
    existing.quantity = totalQty;
    existing.avgPrice = newAvg;
  } else {
    portfolio.holdings.push({ symbol, quantity, avgPrice: price });
  }

  // Create order record
  const order = new Order({
    user: req.userId,
    symbol: symbol.toUpperCase(),
    orderType: 'buy',
    quantity,
    price,
    totalAmount: cost,
    orderCategory,
    status: 'completed'
  });

  await user.save();
  await portfolio.save();
  await order.save();
  
  res.json({ 
    holdings: portfolio.holdings, 
    walletBalance: user.walletBalance,
    order: order
  });
});

router.post('/sell', async (req, res) => {
  const { symbol, quantity, price, orderCategory = 'delivery' } = req.body;
  if (!symbol || !quantity || !price) return res.status(400).json({ message: 'Missing fields' });
  if (quantity <= 0 || price <= 0) return res.status(400).json({ message: 'Invalid values' });

  const user = await User.findById(req.userId);
  const portfolio = await Portfolio.findOne({ user: req.userId });
  if (!user || !portfolio) return res.status(404).json({ message: 'Portfolio not found' });

  const existing = portfolio.holdings.find(h => h.symbol === symbol);
  if (!existing || existing.quantity < quantity) return res.status(400).json({ message: 'Not enough quantity' });

  existing.quantity -= quantity;
  if (existing.quantity === 0) {
    portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
  }

  const proceeds = quantity * price;
  user.walletBalance += proceeds;

  // Create order record
  const order = new Order({
    user: req.userId,
    symbol: symbol.toUpperCase(),
    orderType: 'sell',
    quantity,
    price,
    totalAmount: proceeds,
    orderCategory,
    status: 'completed'
  });

  await user.save();
  await portfolio.save();
  await order.save();
  
  res.json({ 
    holdings: portfolio.holdings, 
    walletBalance: user.walletBalance,
    order: order
  });
});

export default router;

