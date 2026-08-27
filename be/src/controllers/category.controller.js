const categoryService =
  require('../services/category.service');

async function createCategory(req, res, next) {
  try {
    const result =
      await categoryService.createCategory(
        req.body,
        req.user
      );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getAllCategories(req, res, next) {
  try {
    const result =
      await categoryService.getAllCategories();

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const result =
      await categoryService.getCategoryById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const result =
      await categoryService.updateCategory(
        req.params.id,
        req.body,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const result =
      await categoryService.deleteCategory(
        req.params.id,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};