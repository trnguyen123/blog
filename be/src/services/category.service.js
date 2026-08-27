const categoryModel =
  require('../models/category.model');

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

async function createCategory(
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
      'Category name is required'
    );

    error.statusCode = 400;
    throw error;
  }

  if (!slug) {
    const error = new Error(
      'Category slug is invalid'
    );

    error.statusCode = 400;
    throw error;
  }

  const existingCategory =
    await categoryModel.findCategoryBySlug(slug);

  if (existingCategory) {
    const error = new Error(
      'Category slug already exists'
    );

    error.statusCode = 409;
    throw error;
  }

  const categoryId =
    await categoryModel.createCategory({
      name,
      slug,
      description
    });

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || null,
    action: 'CREATE_CATEGORY',
    targetType: 'category',
    targetId: categoryId
  });

  return categoryModel.findCategoryById(
    categoryId
  );
}

async function getAllCategories() {
  return categoryModel.getAllCategories();
}

async function getCategoryById(id) {
  const category =
    await categoryModel.findCategoryById(id);

  if (!category) {
    const error = new Error(
      'Category not found'
    );

    error.statusCode = 404;
    throw error;
  }

  return category;
}

async function updateCategory(
  id,
  payload,
  currentUser = null
) {
  const existingCategory =
    await categoryModel.findCategoryById(id);

  if (!existingCategory) {
    const error = new Error(
      'Category not found'
    );

    error.statusCode = 404;
    throw error;
  }

  const name =
    payload.name !== undefined
      ? String(payload.name).trim()
      : existingCategory.name;

  const description =
    payload.description !== undefined
      ? payload.description
        ? String(payload.description).trim()
        : null
      : existingCategory.description;

  const slug =
    payload.slug !== undefined
      ? slugify(payload.slug)
      : slugify(name);

  if (!name) {
    const error = new Error(
      'Category name is required'
    );

    error.statusCode = 400;
    throw error;
  }

  if (!slug) {
    const error = new Error(
      'Category slug is invalid'
    );

    error.statusCode = 400;
    throw error;
  }

  const categoryWithSameSlug =
    await categoryModel.findCategoryBySlug(slug);

  if (
    categoryWithSameSlug &&
    Number(categoryWithSameSlug.id) !== Number(id)
  ) {
    const error = new Error(
      'Category slug already exists'
    );

    error.statusCode = 409;
    throw error;
  }

  await categoryModel.updateCategory(id, {
    name,
    slug,
    description
  });

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || null,
    action: 'UPDATE_CATEGORY',
    targetType: 'category',
    targetId: id
  });

  return categoryModel.findCategoryById(id);
}

async function deleteCategory(
  id,
  currentUser = null
) {
  const existingCategory =
    await categoryModel.findCategoryById(id);

  if (!existingCategory) {
    const error = new Error(
      'Category not found'
    );

    error.statusCode = 404;
    throw error;
  }

  const deleted =
    await categoryModel.deleteCategory(id);

  if (!deleted) {
    const error = new Error(
      'Delete category failed'
    );

    error.statusCode = 400;
    throw error;
  }

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || null,
    action: 'DELETE_CATEGORY',
    targetType: 'category',
    targetId: id
  });

  return {
    deleted: true
  };
}

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};