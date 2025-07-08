import { Router } from 'express'
import { validate } from '../middleware/validatePayload.js'
import Joi from 'joi'
import { generateTokens, revokeToken } from '../services/tokenService.js'
import { pool } from '../services/dbMigrations.js'
const router = Router()
router.post('/login', validate(Joi.object({ body: Joi.object({ email:
Joi.string().email().required(), password: Joi.string().required() }) })),
async (req, res) => {
const { email, password } = req.body
const { rows } = await pool.query('SELECT id, password_hash FROM users 
WHERE email=$1', [email])
if (!rows.length) return res.sendStatus(401)
// compare hash omitted for brevity
const tokens = generateTokens({ id: rows[0].id })
res.json(tokens)
})
router.post('/refresh', async (req, res) => {
const { token } = req.body
try {
const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
if (await isRevoked(token)) return res.sendStatus(401)
const tokens = generateTokens({ id: payload.id })
await revokeToken(token)
res.json(tokens)
} catch {
res.sendStatus(401)
}
})
router.post('/logout', async (req, res) => { await
revokeToken(req.body.refresh); res.sendStatus(204) })
export default router