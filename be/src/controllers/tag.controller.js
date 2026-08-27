const tagService = require('../services/tag.service');

async function createTag(req, res, next) {
  try {
    const result = await tagService.createTag(
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getAllTags(req, res, next) {
  try {
    const result = await tagService.getAllTags();

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getTagById(req, res, next) {
  try {
    const result = await tagService.getTagById(
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

async function updateTag(req, res, next) {
  try {
    const result = await tagService.updateTag(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function deleteTag(req, res, next) {
  try {
    const result = await tagService.deleteTag(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: 'Tag deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag
};