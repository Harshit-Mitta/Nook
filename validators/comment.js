const Joi = require("joi");

const createCommentSchema = Joi.object({
  author: Joi.string().required(),
  text: Joi.string().min(0)
})


module.exports = {
  createCommentSchema,
}