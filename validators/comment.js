const Joi = require("joi");

const createCommentSchema = Joi.object({
  author: Joi.string(),
  content: Joi.string().min(0),
});

module.exports = {
  createCommentSchema,
};
