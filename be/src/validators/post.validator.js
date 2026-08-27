function validateCreatePost(req, res, next) {
  const {
    title,
    content,
    status,
    visibility,
    categoryIds,
    tagIds
  } = req.body;

  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('title is required');
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    errors.push('content is required');
  }

  if (status && !['draft', 'published', 'archived'].includes(status)) {
    errors.push('status must be draft, published or archived');
  }

  if (visibility && !['public', 'premium', 'private'].includes(visibility)) {
    errors.push('visibility must be public, premium or private');
  }

  if (categoryIds && !Array.isArray(categoryIds)) {
    errors.push('categoryIds must be an array');
  }

  if (tagIds && !Array.isArray(tagIds)) {
    errors.push('tagIds must be an array');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

function validateUpdatePost(req, res, next) {
  const {
    title,
    content,
    status,
    visibility,
    categoryIds,
    tagIds
  } = req.body;

  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    errors.push('title must be a non-empty string');
  }

  if (content !== undefined && (typeof content !== 'string' || !content.trim())) {
    errors.push('content must be a non-empty string');
  }

  if (status !== undefined && !['draft', 'published', 'archived'].includes(status)) {
    errors.push('status must be draft, published or archived');
  }

  if (visibility !== undefined && !['public', 'premium', 'private'].includes(visibility)) {
    errors.push('visibility must be public, premium or private');
  }

  if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
    errors.push('categoryIds must be an array');
  }

  if (tagIds !== undefined && !Array.isArray(tagIds)) {
    errors.push('tagIds must be an array');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

module.exports = {
  validateCreatePost,
  validateUpdatePost
};