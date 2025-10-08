const Joi = require("joi");

const createPostSchema = Joi.object({
  title: Joi.string().required(),
  author: Joi.string().required(),
  likes: Joi.number().min(0).max(100000),
  image: Joi.string().required(),
  content: Joi.string()
})

// const editProductSchema = Joi.object({})

module.exports = {
  createPostSchema,
  // editProductSchema
}