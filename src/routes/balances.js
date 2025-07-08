import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
const router = Router()
router.get('/', authenticate, async (req, res) => {/* get balances */})
router.post('/prepaid-alert', authenticate, async (req, res) => {/* send 
alert */})
export default router