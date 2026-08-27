const authorStatsService = require('../services/author-stats.service');

async function getMyAuthorOverview(req, res, next) {
  try {
    const data = await authorStatsService.getMyAuthorOverview(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Author overview fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getMyTopPosts(req, res, next) {
  try {
    const limit = req.query.limit || 5;

    const data = await authorStatsService.getMyTopPosts(req.user.id, limit);

    return res.status(200).json({
      success: true,
      message: 'Author top posts fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyAuthorOverview,
  getMyTopPosts
};