const Joi = require("joi");

const createPostSchema = Joi.object({
  title: Joi.string().required(),
  author: Joi.string().required(),
  content: Joi.string().required(),
  image: Joi.string().uri().allow('').optional(), // Optional URL for external images
  // Note: media files are handled by multer, not Joi validation
});


// const editProductSchema = Joi.object({})

module.exports = {
  createPostSchema,
  // editProductSchema
}