const { sendSuccess, sendError } = require('../utils/response');
const leaderboardService = require('../services/leaderboardService');

class LeaderboardController {
  static async getLeaderboard(req, res) {
    try {
      const { period = 'day' } = req.query;
      
      if (!['day', 'month', 'overall'].includes(period)) {
        return sendError(res, 'Invalid period. Must be day, month, or overall', 400);
      }

      const leaderboard = await leaderboardService.getLeaderboard(period);
      
      return sendSuccess(res, leaderboard, 'Leaderboard retrieved successfully');
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async getUserRank(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'day' } = req.query;
      
      if (!['day', 'month', 'overall'].includes(period)) {
        return sendError(res, 'Invalid period. Must be day, month, or overall', 400);
      }

      const rank = await leaderboardService.getUserRank(userId, period);
      
      return sendSuccess(res, rank, 'User rank retrieved successfully');
    } catch (error) {
      console.error('Get user rank error:', error);
      return sendError(res, error.message, 500, error);
    }
  }
}

module.exports = LeaderboardController;
