import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ 
        message: 'Missing or invalid session_id' 
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.status(200).json({ 
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        metadata: session.metadata
      }
    });

  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving session details'
    });
  }
}
