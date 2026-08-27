const { pool } = require('../config/db');

const commentModel = require('../models/comment.model');
const postModel = require('../models/post.model');
const aiModerationLogModel =
  require('../models/aiModerationLog.model');

const {
  moderateComment
} = require('./aiModeration.service');

const notificationService =
  require('./notification.service');

const activityLogService =
  require('./activityLog.service');

const {
  emitToUser,
  emitToRole
} = require('../sockets/socketServer');

async function createComment({
  postId,
  userId,
  parentId = null,
  content
}) {
  const post =
    await postModel.findPostById(postId);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  if (post.status !== 'published') {
    const error = new Error(
      'Cannot comment on unpublished post'
    );

    error.statusCode = 400;
    throw error;
  }

  if (parentId) {
    const parentComment =
      await commentModel.findCommentById(parentId);

    if (!parentComment) {
      const error = new Error(
        'Parent comment not found'
      );

      error.statusCode = 404;
      throw error;
    }

    if (
      Number(parentComment.post_id) !== Number(postId)
    ) {
      const error = new Error(
        'Parent comment does not belong to this post'
      );

      error.statusCode = 400;
      throw error;
    }
  }

  let aiResult;

  try {
    aiResult = await moderateComment(content);
  } catch (err) {
    aiResult = {
      label: 'UNKNOWN',
      ai_score: 0,
      moderation_status: 'pending',
      probabilities: null,
      error: err.message
    };
  }

  const finalStatus =
    aiResult.moderation_status || 'pending';

  const finalAiScore =
    Number(aiResult.ai_score || 0);

  const finalAiFlag =
    finalStatus !== 'approved';

  const conn = await pool.getConnection();

  let commentId;

  try {
    await conn.beginTransaction();

    commentId = await commentModel.createComment(
      {
        postId,
        userId,
        parentId,
        content,
        status: finalStatus,
        aiFlag: finalAiFlag,
        aiScore: finalAiScore
      },
      conn
    );

    await aiModerationLogModel.createModerationLog(
      {
        comment_id: commentId,
        ai_model: 'phobert',
        toxicity_score: finalAiScore,
        spam_score: 0,
        decision: finalStatus,
        raw_response: aiResult
      },
      conn
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  const createdComment =
    await commentModel.findCommentById(commentId);

  await activityLogService.tryLogActivity({
    userId,
    action: 'CREATE_COMMENT',
    targetType: 'comment',
    targetId: commentId
  });

  if (finalStatus !== 'approved') {
    await activityLogService.tryLogActivity({
      userId: null,
      action: 'AI_FLAG_COMMENT',
      targetType: 'comment',
      targetId: commentId
    });
  }

  // WebSocket + notification chỉ chạy sau transaction commit
  try {
    const pingPayload = {
      commentId,
      postId: post.id,
      postTitle: post.title,
      postAuthorId: post.author_id,
      status: finalStatus
    };

    emitToRole(
      'admin',
      'comment:pending',
      pingPayload
    );

    emitToUser(
      post.author_id,
      'comment:pending',
      pingPayload
    );

    if (
      finalStatus !== 'approved' &&
      Number(post.author_id) !== Number(userId)
    ) {
      await notificationService.notifyUser({
        recipientId: post.author_id,
        actorId: userId,
        entityType: 'comment',
        entityId: commentId,
        type: 'comment_pending',
        title: 'Bình luận mới cần duyệt',
        message:
          `Có bình luận mới trên bài "${post.title}" đang chờ bạn duyệt.`,
        dedupeMinutes: null
      });
    }
  } catch (err) {
    console.error(
      '[comment.service] notify lỗi:',
      err.message
    );
  }

  return createdComment;
}

async function getCommentsByPostId(
  postId,
  currentUserId = null
) {
  const post =
    await postModel.findPostById(postId);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  return commentModel.getCommentsByPostId(
    postId,
    currentUserId
  );
}

async function getCommentReplies(
  parentId,
  currentUserId = null
) {
  const parentComment =
    await commentModel.findCommentById(parentId);

  if (!parentComment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  return commentModel.getCommentReplies(
    parentId,
    currentUserId
  );
}

async function getPendingCommentsByPostId(postId) {
  const post =
    await postModel.findPostById(postId);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  return commentModel.getPendingCommentsByPostId(
    postId
  );
}

async function updateCommentStatus({
  commentId,
  status,
  currentUser
}) {
  const comment =
    await commentModel.findCommentById(commentId);

  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  const post =
    await postModel.findPostById(comment.post_id);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  const roles = currentUser.roles || [];

  const isAdmin =
    roles.includes('admin') ||
    roles.includes('super_admin');

  const isAuthorOwner =
    Number(post.author_id) ===
    Number(currentUser.id);

  if (!isAdmin && !isAuthorOwner) {
    const error = new Error(
      'You do not have permission to moderate this comment'
    );

    error.statusCode = 403;
    throw error;
  }

  const allowedStatuses = [
    'pending',
    'approved',
    'rejected'
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      'Invalid comment status'
    );

    error.statusCode = 400;
    throw error;
  }

  const updated =
    await commentModel.updateCommentStatus(
      commentId,
      status
    );

  if (!updated) {
    const error = new Error(
      'Update comment status failed'
    );

    error.statusCode = 400;
    throw error;
  }

  let action = 'UPDATE_COMMENT_STATUS';

  if (status === 'approved') {
    action = 'APPROVE_COMMENT';
  }

  if (status === 'rejected') {
    action = 'REJECT_COMMENT';
  }

  await activityLogService.tryLogActivity({
    userId: currentUser.id,
    action,
    targetType: 'comment',
    targetId: commentId
  });

  // WebSocket + notification
  if (
    status === 'approved' ||
    status === 'rejected'
  ) {
    try {
      emitToUser(
        comment.user_id,
        'comment:status_changed',
        {
          commentId,
          postId: post.id,
          status
        }
      );

      if (
        Number(comment.user_id) !==
        Number(currentUser.id)
      ) {
        await notificationService.notifyUser({
          recipientId: comment.user_id,
          actorId: currentUser.id,
          entityType: 'comment',
          entityId: commentId,
          type:
            status === 'approved'
              ? 'comment_approved'
              : 'comment_rejected',
          title:
            status === 'approved'
              ? 'Bình luận đã được duyệt'
              : 'Bình luận đã bị từ chối',
          message:
            status === 'approved'
              ? `Bình luận của bạn trên bài "${post.title}" đã được duyệt.`
              : `Bình luận của bạn trên bài "${post.title}" đã bị từ chối.`
        });
      }
    } catch (err) {
      console.error(
        '[comment.service] notify status lỗi:',
        err.message
      );
    }
  }

  return updated;
}

async function updateCommentContent({
  commentId,
  userId,
  content
}) {
  const comment =
    await commentModel.findCommentById(commentId);

  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    Number(comment.user_id) !== Number(userId)
  ) {
    const error = new Error(
      'You can only edit your own comment'
    );

    error.statusCode = 403;
    throw error;
  }

  const updated =
    await commentModel.updateCommentContent(
      commentId,
      content
    );

  if (!updated) {
    const error = new Error(
      'Update comment failed'
    );

    error.statusCode = 400;
    throw error;
  }

  await activityLogService.tryLogActivity({
    userId,
    action: 'UPDATE_COMMENT',
    targetType: 'comment',
    targetId: commentId
  });

  return updated;
}

async function deleteComment({
  commentId,
  currentUser
}) {
  const comment =
    await commentModel.findCommentById(commentId);

  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  const roles = currentUser.roles || [];

  const isAdmin =
    roles.includes('admin') ||
    roles.includes('super_admin');

  const isOwner =
    Number(comment.user_id) ===
    Number(currentUser.id);

  if (!isAdmin && !isOwner) {
    const error = new Error(
      'You do not have permission to delete this comment'
    );

    error.statusCode = 403;
    throw error;
  }

  const deleted =
    await commentModel.softDeleteComment(commentId);

  if (!deleted) {
    const error = new Error(
      'Delete comment failed'
    );

    error.statusCode = 400;
    throw error;
  }

  await activityLogService.tryLogActivity({
    userId: currentUser.id,
    action: 'DELETE_COMMENT',
    targetType: 'comment',
    targetId: commentId
  });

  return true;
}

async function getMyComments(userId) {
  return commentModel.getCommentsByUserId(userId);
}

async function likeComment({
  commentId,
  userId
}) {
  const comment =
    await commentModel.findCommentById(commentId);

  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  await commentModel.likeComment(
    commentId,
    userId
  );

  return {
    commentId,
    isLiked: true,
    likeCount:
      await commentModel.countLikesByCommentId(
        commentId
      )
  };
}

async function unlikeComment({
  commentId,
  userId
}) {
  const comment =
    await commentModel.findCommentById(commentId);

  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  await commentModel.unlikeComment(
    commentId,
    userId
  );

  return {
    commentId,
    isLiked: false,
    likeCount:
      await commentModel.countLikesByCommentId(
        commentId
      )
  };
}

async function reportComment({
  commentId,
  reportedBy,
  reason
}) {
  const comment =
    await commentModel.findCommentById(commentId);

  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  if (!reason || !reason.trim()) {
    const error = new Error('Reason is required');
    error.statusCode = 400;
    throw error;
  }

  const alreadyReported =
    await commentModel.hasUserReportedComment(
      commentId,
      reportedBy
    );

  if (alreadyReported) {
    const error = new Error(
      'You have already reported this comment'
    );

    error.statusCode = 400;
    throw error;
  }

  const reportId =
    await commentModel.reportComment({
      commentId,
      reportedBy,
      reason: reason.trim()
    });

  await activityLogService.tryLogActivity({
    userId: reportedBy,
    action: 'REPORT_COMMENT',
    targetType: 'comment',
    targetId: commentId
  });

  return {
    id: reportId,
    commentId,
    reportedBy,
    reason: reason.trim()
  };
}

async function getReportsByCommentId({
  commentId,
  currentUser
}) {
  const comment =
    await commentModel.findCommentById(commentId);

  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  const roles = currentUser.roles || [];

  const isAdmin =
    roles.includes('admin') ||
    roles.includes('super_admin');

  if (!isAdmin) {
    const error = new Error(
      'You do not have permission to view reports'
    );

    error.statusCode = 403;
    throw error;
  }

  return commentModel.getReportsByCommentId(
    commentId
  );
}

async function getPendingCommentsForAuthor(
  authorId,
  limit
) {
  return commentModel.getPendingCommentsByAuthorId(
    authorId,
    limit
  );
}

async function getModerationCommentsForAuthor(
  authorId,
  limit
) {
  return commentModel.getCommentsForModerationByAuthorId(
    authorId,
    limit
  );
}

async function getAllModerationComments(limit) {
  return commentModel.getAllCommentsForModeration(
    limit
  );
}

module.exports = {
  createComment,
  getCommentsByPostId,
  getCommentReplies,
  getPendingCommentsByPostId,
  getModerationCommentsForAuthor,
  getAllModerationComments,
  updateCommentStatus,
  updateCommentContent,
  deleteComment,
  getMyComments,
  likeComment,
  unlikeComment,
  reportComment,
  getReportsByCommentId,
  getPendingCommentsForAuthor
};