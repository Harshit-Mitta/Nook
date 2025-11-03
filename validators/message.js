const Joi = require("joi");

const messageSchema = Joi.object({
  body: Joi.string().required().messages({
    "string.empty": "Message cannot be empty"
  }),
});

module.exports = { messageSchema };
