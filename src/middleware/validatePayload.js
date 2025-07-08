import Joi from 'joi'
export const validate = schema => (req, res, next) => {
const { error } = schema.validate({ body: req.body, query: req.query,
params: req.params })
if (error) return res.status(400).json({ message:
error.details[0].message })
next()
}