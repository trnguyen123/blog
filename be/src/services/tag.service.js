const tagModel = require('../models/tag.model');
const activityLogService =
  require('./activityLog.service');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function createTag(
  payload,
  currentUser = null
) {
  const name = payload.name
    ? String(payload.name).trim()
    : '';

  const description = payload.description
    ? String(payload.description).trim()
    : null;

  const slug = payload.slug
    ? slugify(payload.slug)
    : slugify(name);

  if (!name) {
    const error = new Error(
      'Tag name is required'
    );

    error.statusCode = 400;
    throw error;
  }

  if (!slug) {
    const error = new Error(
      'Tag slug is invalid'
    );

    error.statusCode = 400;
    throw error;
  }

  const existingTag =
    await tagModel.findTagBySlug(slug);

  if (existingTag) {
    const error = new Error(
      'Tag slug already exists'
    );

    error.statusCode = 409;
    throw error;
  }

  const tagId = await tagModel.createTag({
    name,
    slug,
    description
  });

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || null,
    action: 'CREATE_TAG',
    targetType: 'tag',
    targetId: tagId
  });

  return tagModel.findTagById(tagId);
}

async function getAllTags() {
  return tagModel.getAllTags();
}

async function getTagById(id) {
  const tag = await tagModel.findTagById(id);

  if (!tag) {
    const error = new Error('Tag not found');
    error.statusCode = 404;
    throw error;
  }

  return tag;
}

async function updateTag(
  id,
  payload,
  currentUser = null
) {
  const existingTag =
    await tagModel.findTagById(id);

  if (!existingTag) {
    const error = new Error('Tag not found');
    error.statusCode = 404;
    throw error;
  }

  const name =
    payload.name !== undefined
      ? String(payload.name).trim()
      : existingTag.name;

  const description =
    payload.description !== undefined
      ? payload.description
        ? String(payload.description).trim()
        : null
      : existingTag.description;

  const slug =
    payload.slug !== undefined
      ? slugify(payload.slug)
      : slugify(name);

  if (!name) {
    const error = new Error(
      'Tag name is required'
    );

    error.statusCode = 400;
    throw error;
  }

  if (!slug) {
    const error = new Error(
      'Tag slug is invalid'
    );

    error.statusCode = 400;
    throw error;
  }

  const tagWithSameSlug =
    await tagModel.findTagBySlug(slug);

  if (
    tagWithSameSlug &&
    Number(tagWithSameSlug.id) !== Number(id)
  ) {
    const error = new Error(
      'Tag slug already exists'
    );

    error.statusCode = 409;
    throw error;
  }

  await tagModel.updateTag(id, {
    name,
    slug,
    description
  });

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || null,
    action: 'UPDATE_TAG',
    targetType: 'tag',
    targetId: id
  });

  return tagModel.findTagById(id);
}

async function deleteTag(
  id,
  currentUser = null
) {
  const existingTag =
    await tagModel.findTagById(id);

  if (!existingTag) {
    const error = new Error('Tag not found');
    error.statusCode = 404;
    throw error;
  }

  const deleted =
    await tagModel.deleteTag(id);

  if (!deleted) {
    const error = new Error(
      'Delete tag failed'
    );

    error.statusCode = 400;
    throw error;
  }

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || null,
    action: 'DELETE_TAG',
    targetType: 'tag',
    targetId: id
  });

  return {
    deleted: true
  };
}

module.exports = {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag
};