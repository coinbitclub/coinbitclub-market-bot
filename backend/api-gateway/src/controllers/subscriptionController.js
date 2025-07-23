import express from 'express';
import Stripe from 'stripe';
import { db } from '../../../common/db.js';
import { validate, validateBody } from '../../../common/validation.js';
import { handleAsyncError } from '../../../common/utils.js';
import { env } from '../../../common/env.js';
import logger from '../../../common/logger.js';
import emailService from '../services/emailService.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create subscription
export const createSubscription = handleAsyncError(async (req, res) => {
  const { planId, paymentMethodId } = req.body;
  const userId = req.user.id;
  
  // Get user and plan
  const [user, plan] = await Promise.all([
    db('users').where({ id: userId }).first(),
    db('plans').where({ id: planId, is_active: true }).first()
  ]);
  
  if (!user || !plan) {
    return res.status(404).json({ error: 'User or plan not found' });
  }
  
  // Check if user already has active subscription
  const existingSubscription = await db('subscriptions')
    .where({ user_id: userId, status: 'active' })
    .first();
  
  if (existingSubscription) {
    return res.status(400).json({ error: 'User already has an active subscription' });
  }
  
  try {
    // Create or get Stripe customer
    let stripeCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    
    if (stripeCustomer.data.length === 0) {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id }
      });
    } else {
      stripeCustomer = stripeCustomer.data[0];
    }
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomer.id
    });
    
    // Set as default payment method
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: plan.stripe_price_id }],
      default_payment_method: paymentMethodId,
      trial_period_days: plan.name === 'Trial' ? 7 : undefined,
      metadata: {
        userId: user.id,
        planId: plan.id.toString()
      }
    });
    
    // Save subscription to database
    const [subscriptionRecord] = await db('subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomer.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      metadata: {
        stripeData: subscription
      }
    }).returning('*');
    
    // Calculate affiliate commission if user has affiliate
    if (user.affiliate_id) {
      const commissionRate = 0.15; // 15% commission
      const commissionAmount = plan.price * commissionRate;
      
      await db('affiliate_commissions').insert({
        user_id: userId,
        affiliate_id: user.affiliate_id,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        commission_type: 'subscription',
        status: 'pending',
        metadata: {
          planId: plan.id,
          subscriptionId: subscription.id
        }
      });
      
      logger.info({ 
        userId, 
        affiliateId: user.affiliate_id, 
        commissionAmount 
      }, 'Affiliate commission created');
    }
    
    // Log audit trail
    await db('audit_logs').insert({
      user_id: userId,
      action: 'subscription_created',
      resource_type: 'subscription',
      resource_id: subscriptionRecord.id.toString(),
      details: {
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        stripeSubscriptionId: subscription.id
      }
    });
    
    logger.info({ 
      userId, 
      planId, 
      subscriptionId: subscription.id 
    }, 'Subscription created successfully');
    
    res.json({
      message: 'Subscription created successfully',
      subscription: subscriptionRecord,
      stripeSubscription: subscription
    });
    
  } catch (error) {
    logger.error({ error, userId, planId }, 'Failed to create subscription');
    
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        error: 'Payment failed',
        details: error.message 
      });
    }
    
    throw error;
  }
});

// Cancel subscription
export const cancelSubscription = handleAsyncError(async (req, res) => {
  const { subscriptionId } = req.params;
  const userId = req.user.id;
  
  // Get subscription
  const subscription = await db('subscriptions')
    .where({ id: subscriptionId, user_id: userId })
    .first();
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  if (subscription.status === 'canceled') {
    return res.status(400).json({ error: 'Subscription already canceled' });
  }
  
  try {
    // Cancel in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );
    
    // Update database
    await db('subscriptions')
      .where({ id: subscriptionId })
      .update({
        status: stripeSubscription.status,
        canceled_at: new Date(),
        updated_at: db.fn.now()
      });
    
    // Log audit trail
    await db('audit_logs').insert({
      user_id: userId,
      action: 'subscription_canceled',
      resource_type: 'subscription',
      resource_id: subscriptionId.toString(),
      details: {
        canceledAt: new Date(),
        willEndAt: new Date(stripeSubscription.current_period_end * 1000)
      }
    });
    
    logger.info({ userId, subscriptionId }, 'Subscription canceled');
    
    res.json({
      message: 'Subscription canceled successfully',
      willEndAt: new Date(stripeSubscription.current_period_end * 1000)
    });
    
  } catch (error) {
    logger.error({ error, userId, subscriptionId }, 'Failed to cancel subscription');
    throw error;
  }
});

// Get user subscriptions
export const getUserSubscriptions = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  const subscriptions = await db('subscriptions')
    .join('plans', 'subscriptions.plan_id', 'plans.id')
    .where({ 'subscriptions.user_id': userId })
    .select(
      'subscriptions.*',
      'plans.name as plan_name',
      'plans.price as plan_price',
      'plans.features as plan_features'
    )
    .orderBy('subscriptions.created_at', 'desc');
  
  res.json(subscriptions);
});

// Get subscription details
export const getSubscriptionDetails = handleAsyncError(async (req, res) => {
  const { subscriptionId } = req.params;
  const userId = req.user.id;
  
  const subscription = await db('subscriptions')
    .join('plans', 'subscriptions.plan_id', 'plans.id')
    .where({ 
      'subscriptions.id': subscriptionId,
      'subscriptions.user_id': userId 
    })
    .select(
      'subscriptions.*',
      'plans.name as plan_name',
      'plans.description as plan_description',
      'plans.price as plan_price',
      'plans.features as plan_features'
    )
    .first();
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  // Get latest invoice from Stripe
  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
      { expand: ['latest_invoice'] }
    );
    
    res.json({
      ...subscription,
      stripeData: {
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        latestInvoice: stripeSubscription.latest_invoice
      }
    });
  } catch (error) {
    logger.warn({ error, subscriptionId }, 'Failed to fetch Stripe data');
    res.json(subscription);
  }
});

// Webhook handler for Stripe events
export const stripeWebhook = handleAsyncError(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.error({ error }, 'Webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  logger.info({ eventType: event.type, eventId: event.id }, 'Processing Stripe webhook');
  
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
        
      default:
        logger.info({ eventType: event.type }, 'Unhandled webhook event');
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error({ error, event }, 'Webhook processing failed');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper functions
async function handleSubscriptionEvent(subscription) {
  await db('subscriptions')
    .where({ stripe_subscription_id: subscription.id })
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
      updated_at: db.fn.now()
    });
}

async function handleInvoicePaymentSucceeded(invoice) {
  const subscription = await db('subscriptions')
    .where({ stripe_subscription_id: invoice.subscription })
    .first();
    
  if (subscription) {
    // Mark affiliate commission as approved if payment succeeded
    await db('affiliate_commissions')
      .where({ 
        user_id: subscription.user_id,
        commission_type: 'subscription',
        status: 'pending'
      })
      .update({ status: 'approved' });
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const subscription = await db('subscriptions')
    .where({ stripe_subscription_id: invoice.subscription })
    .first();
    
  if (subscription) {
    const user = await db('users').where({ id: subscription.user_id }).first();
    
    // Send payment failed notification
    await emailService.sendEmail(user.email, 'paymentFailed', { 
      userName: user.name,
      amount: invoice.amount_due / 100,
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    });
  }
}

// Routes
router.post('/subscriptions', createSubscription);
router.delete('/subscriptions/:subscriptionId', cancelSubscription);
router.get('/subscriptions', getUserSubscriptions);
router.get('/subscriptions/:subscriptionId', getSubscriptionDetails);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
