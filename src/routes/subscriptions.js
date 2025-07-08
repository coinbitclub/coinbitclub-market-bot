import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
const router = Router()
router.post('/', authenticate, async (req, res) => {/* subscribe user */})
router.get('/:id', authenticate, async (req, res) =>
{/* subscription details */})
export default router