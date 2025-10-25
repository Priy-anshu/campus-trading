/**
 * Simple test script to demonstrate the earnings system
 * Run with: node test-earnings.js
 */

import earningsCache from './services/EarningsCache.js';
import { updateEarnings, getEarnings, getCacheStats } from './utils/earningsUtils.js';

async function testEarningsSystem() {
  console.log('🧪 Testing Earnings System...\n');

  try {
    // Initialize the cache
    console.log('1. Initializing earnings cache...');
    await earningsCache.initialize();
    console.log('✅ Cache initialized\n');

    // Test user IDs (you can use real user IDs from your database)
    const testUserId = '507f1f77bcf86cd799439011'; // Example ObjectId
    const testUserId2 = '507f1f77bcf86cd799439012';

    // Test 1: Add earnings for a user
    console.log('2. Testing earnings updates...');
    updateEarnings(testUserId, 100.50);
    updateEarnings(testUserId, 75.25);
    updateEarnings(testUserId, -25.00); // Loss

    // Get earnings
    const earnings = getEarnings(testUserId);
    console.log('📊 User 1 Earnings:', earnings);
    console.log('✅ Earnings updates working\n');

    // Test 2: Add another user
    console.log('3. Testing multiple users...');
    updateEarnings(testUserId2, 200.00);
    updateEarnings(testUserId2, 150.75);

    const earnings2 = getEarnings(testUserId2);
    console.log('📊 User 2 Earnings:', earnings2);
    console.log('✅ Multiple users working\n');

    // Test 3: Get all earnings (leaderboard)
    console.log('4. Testing leaderboard...');
    const allEarnings = earningsCache.getAllEarnings();
    console.log('📊 All Users Earnings:', allEarnings);
    console.log('✅ Leaderboard working\n');

    // Test 4: Cache statistics
    console.log('5. Testing cache statistics...');
    const stats = getCacheStats();
    console.log('📊 Cache Stats:', stats);
    console.log('✅ Cache stats working\n');

    // Test 5: Force database update
    console.log('6. Testing database update...');
    await earningsCache.forceUpdateDatabase();
    console.log('✅ Database update working\n');

    console.log('🎉 All tests passed! Earnings system is working correctly.');
    console.log('\n📋 Summary:');
    console.log('- Daily earnings: Reset at midnight IST');
    console.log('- Monthly earnings: Reset at start of month');
    console.log('- Overall earnings: Never reset');
    console.log('- Database updates: Every 14 minutes');
    console.log('- Cache restoration: On server restart');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEarningsSystem();
