const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().trim().email().max(150).required(),
  password: Joi.string().min(6).max(100).required()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(150).required(),
  password: Joi.string().min(6).max(100).required()
});

module.exports = {
  registerSchema,
  loginSchema
};