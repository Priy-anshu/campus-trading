const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://priyanshu102938_db_user:MySecure123@cluster0.nobx0qb.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
