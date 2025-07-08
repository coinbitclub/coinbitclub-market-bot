src/controllers/subscriptionController.js
js
CopiarEditar
import { saveSubscription } from '../services/subscriptionService.js';
import { getUserById } from '../services/userService.js';
import { recordSubscriptionCommission } from '../services/affiliateService.js';

export async function createSubscription(req, res) {
  const userId = req.user.id;
  const { plan_id, amount } = req.body;
  const sub = await saveSubscription(userId, plan_id, amount);

  // 50% de comissão na primeira mensalidade
  const user = await getUserById(userId);
  if (user.referred_by) {
    const com = await recordSubscriptionCommission(
      user.referred_by,
      userId,
      amount
    );
    console.log(`Comissão de assinatura: ${com}`);
  }

  res.status(201).json(sub);
}
