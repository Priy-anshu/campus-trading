import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    avgPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    holdings: { type: [holdingSchema], default: [] },
  },
  { timestamps: true }
);

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;

