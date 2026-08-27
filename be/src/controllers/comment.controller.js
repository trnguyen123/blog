const commentService = require('../services/comment.service');

async function createComment(req, res, next) {
  try {
    const { postId } = req.params;
    const { content, parentId = null } = req.body;

    const comment = await commentService.createComment({
      postId: Number(postId),
      userId: req.user.id,
      parentId: parentId ? Number(parentId) : null,
      content
    });

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
}

async function createReply(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    const comment = await commentService.createComment({
      postId: Number(postId),
      userId: req.user.id,
      parentId: Number(commentId),
      content
    });

    return res.status(201).json({
      success: true,
      message: 'Reply created successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
}

async function getCommentsByPostId(req, res, next) {
  try {
    const { postId } = req.params;

    const comments = await commentService.getCommentsByPostId(
      Number(postId),
      req.user ? req.user.id : null
    );

    return res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      data: comments
    });
  } catch (error) {
    next(error);
  }
}

async function getCommentReplies(req, res, next) {
  try {
    const { commentId } = req.params;

    const replies = await commentService.getCommentReplies(
      Number(commentId),
      req.user ? req.user.id : null
    );

    return res.status(200).json({
      success: true,
      message: 'Replies fetched successfully',
      data: replies
    });
  } catch (error) {
    next(error);
  }
}

async function getPendingCommentsByPostId(req, res, next) {
  try {
    const { postId } = req.params;

    const comments = await commentService.getPendingCommentsByPostId(Number(postId));

    return res.status(200).json({
      success: true,
      message: 'Pending comments fetched successfully',
      data: comments
    });
  } catch (error) {
    next(error);
  }
}

async function updateCommentStatus(req, res, next) {
  try {
    const { commentId } = req.params;
    const { status } = req.body;

    const comment = await commentService.updateCommentStatus({
      commentId: Number(commentId),
      status,
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Comment status updated successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await commentService.updateCommentContent({
      commentId: Number(commentId),
      userId: req.user.id,
      content
    });

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMyComment(req, res, next) {
  try {
    const { commentId } = req.params;

    await commentService.deleteComment({
      commentId: Number(commentId),
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getMyComments(req, res, next) {
  try {
    const comments = await commentService.getMyComments(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'My comments fetched successfully',
      data: comments
    });
  } catch (error) {
    next(error);
  }
}

async function likeComment(req, res, next) {
  try {
    const { commentId } = req.params;

    const result = await commentService.likeComment({
      commentId: Number(commentId),
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Comment liked successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function unlikeComment(req, res, next) {
  try {
    const { commentId } = req.params;

    const result = await commentService.unlikeComment({
      commentId: Number(commentId),
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Comment unliked successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function reportComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    const result = await commentService.reportComment({
      commentId: Number(commentId),
      reportedBy: req.user.id,
      reason
    });

    return res.status(201).json({
      success: true,
      message: 'Comment reported successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getReportsByCommentId(req, res, next) {
  try {
    const { commentId } = req.params;

    const reports = await commentService.getReportsByCommentId({
      commentId: Number(commentId),
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Comment reports fetched successfully',
      data: reports
    });
  } catch (error) {
    next(error);
  }
}

async function getMyPendingComments(req, res, next) {
  try {
    const limit = req.query.limit || 10;

    const comments = await commentService.getPendingCommentsForAuthor(req.user.id, limit);

    return res.status(200).json({
      success: true,
      message: 'Pending comments fetched successfully',
      data: comments
    });
  } catch (error) {
    next(error);
  }
}

async function getMyModerationComments(req, res, next) {
  try {
    const limit = req.query.limit || 50;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');

    const comments = isAdmin
      ? await commentService.getAllModerationComments(limit)
      : await commentService.getModerationCommentsForAuthor(req.user.id, limit);

    return res.status(200).json({
      success: true,
      message: 'Moderation comments fetched successfully',
      data: comments
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComment,
  createReply,
  getCommentsByPostId,
  getCommentReplies,
  getPendingCommentsByPostId,
  getMyPendingComments,
  getMyModerationComments,
  updateCommentStatus,
  updateMyComment,
  deleteMyComment,
  getMyComments,
  likeComment,
  unlikeComment,
  reportComment,
  getReportsByCommentId
};