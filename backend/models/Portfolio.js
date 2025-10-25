import mongoose from 'mongoose';

/**
 * Holding Schema (Subdocument)
 * 
 * Represents a single stock holding within a user's portfolio.
 * Tracks the stock symbol, quantity owned, and average purchase price.
 * 
 * Fields:
 * - symbol: Stock symbol (e.g., 'RELIANCE', 'TCS')
 * - quantity: Number of shares owned (must be >= 0)
 * - avgPrice: Average price paid per share (must be >= 0)
 */
const holdingSchema = new mongoose.Schema(
  {
    symbol: { 
      type: String, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 0 // Cannot have negative quantity
    },
    avgPrice: { 
      type: Number, 
      required: true, 
      min: 0 // Price cannot be negative
    },
  },
  { _id: false } // Disable automatic _id generation for subdocuments
);

/**
 * Portfolio Model Schema
 * 
 * Represents a user's complete stock portfolio containing all their holdings.
 * Each user has exactly one portfolio document that tracks all their stock positions.
 * 
 * Features:
 * - One-to-one relationship with User model
 * - Array of stock holdings with quantity and average price
 * - Automatic timestamps for creation and updates
 * 
 * Schema Fields:
 * - user: Reference to User document (unique, required)
 * - holdings: Array of stock holdings with symbol, quantity, and avgPrice
 */
const portfolioSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      unique: true, 
      required: true 
    },
    holdings: { 
      type: [holdingSchema], 
      default: [] // Start with empty holdings array
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create and export the Portfolio model
const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;

