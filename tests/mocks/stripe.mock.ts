// Mock implementation for Stripe API
export class StripeMock {
  private mockCustomers: Map<string, any> = new Map();
  private mockPaymentIntents: Map<string, any> = new Map();
  private mockSubscriptions: Map<string, any> = new Map();
  private mockProducts: Map<string, any> = new Map();
  private mockPrices: Map<string, any> = new Map();

  constructor(apiKey?: string) {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock products
    const basicProduct = {
      id: 'prod_basic',
      object: 'product',
      active: true,
      name: 'MarketBot Basic',
      description: 'Basic trading plan',
      created: Date.now() / 1000,
      updated: Date.now() / 1000
    };

    const proProduct = {
      id: 'prod_pro',
      object: 'product',
      active: true,
      name: 'MarketBot Pro',
      description: 'Professional trading plan',
      created: Date.now() / 1000,
      updated: Date.now() / 1000
    };

    this.mockProducts.set('prod_basic', basicProduct);
    this.mockProducts.set('prod_pro', proProduct);

    // Mock prices
    const basicPrice = {
      id: 'price_basic_monthly',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: Date.now() / 1000,
      currency: 'usd',
      product: 'prod_basic',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      type: 'recurring',
      unit_amount: 2997, // $29.97
      lookup_key: 'basic_monthly'
    };

    const proPrice = {
      id: 'price_pro_monthly',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: Date.now() / 1000,
      currency: 'usd',
      product: 'prod_pro',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      type: 'recurring',
      unit_amount: 9997, // $99.97
      lookup_key: 'pro_monthly'
    };

    this.mockPrices.set('price_basic_monthly', basicPrice);
    this.mockPrices.set('price_pro_monthly', proPrice);
  }

  // Customers namespace
  customers = {
    create: async (params: any) => {
      const customerId = `cus_${Math.random().toString(36).substr(2, 9)}`;
      const customer = {
        id: customerId,
        object: 'customer',
        created: Math.floor(Date.now() / 1000),
        email: params.email,
        name: params.name,
        description: params.description,
        metadata: params.metadata || {},
        phone: params.phone,
        address: params.address,
        balance: 0,
        currency: 'usd',
        delinquent: false,
        invoice_prefix: customerId.slice(-8).toUpperCase(),
        livemode: false,
        shipping: params.shipping,
        tax_exempt: 'none'
      };

      this.mockCustomers.set(customerId, customer);
      return customer;
    },

    retrieve: async (customerId: string) => {
      const customer = this.mockCustomers.get(customerId);
      if (!customer) {
        throw new Error(`No such customer: ${customerId}`);
      }
      return customer;
    },

    update: async (customerId: string, params: any) => {
      const customer = this.mockCustomers.get(customerId);
      if (!customer) {
        throw new Error(`No such customer: ${customerId}`);
      }

      const updatedCustomer = { ...customer, ...params };
      this.mockCustomers.set(customerId, updatedCustomer);
      return updatedCustomer;
    },

    list: async (params: any = {}) => {
      const customers = Array.from(this.mockCustomers.values());
      return {
        object: 'list',
        data: customers.slice(0, params.limit || 10),
        has_more: false,
        url: '/v1/customers'
      };
    }
  };

  // Payment Intents namespace
  paymentIntents = {
    create: async (params: any) => {
      const paymentIntentId = `pi_${Math.random().toString(36).substr(2, 9)}`;
      const paymentIntent = {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: params.amount,
        currency: params.currency || 'usd',
        status: 'requires_payment_method',
        created: Math.floor(Date.now() / 1000),
        customer: params.customer,
        description: params.description,
        metadata: params.metadata || {},
        payment_method_types: params.payment_method_types || ['card'],
        confirmation_method: params.confirmation_method || 'automatic',
        client_secret: `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`,
        automatic_payment_methods: params.automatic_payment_methods,
        setup_future_usage: params.setup_future_usage
      };

      this.mockPaymentIntents.set(paymentIntentId, paymentIntent);
      return paymentIntent;
    },

    retrieve: async (paymentIntentId: string) => {
      const paymentIntent = this.mockPaymentIntents.get(paymentIntentId);
      if (!paymentIntent) {
        throw new Error(`No such payment_intent: ${paymentIntentId}`);
      }
      return paymentIntent;
    },

    confirm: async (paymentIntentId: string, params: any = {}) => {
      const paymentIntent = this.mockPaymentIntents.get(paymentIntentId);
      if (!paymentIntent) {
        throw new Error(`No such payment_intent: ${paymentIntentId}`);
      }

      const confirmedIntent = {
        ...paymentIntent,
        status: 'succeeded',
        charges: {
          object: 'list',
          data: [{
            id: `ch_${Math.random().toString(36).substr(2, 9)}`,
            object: 'charge',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            customer: paymentIntent.customer,
            status: 'succeeded',
            created: Math.floor(Date.now() / 1000)
          }]
        }
      };

      this.mockPaymentIntents.set(paymentIntentId, confirmedIntent);
      return confirmedIntent;
    }
  };

  // Checkout Sessions namespace
  checkout = {
    sessions: {
      create: async (params: any) => {
        const sessionId = `cs_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
          id: sessionId,
          object: 'checkout.session',
          created: Math.floor(Date.now() / 1000),
          currency: params.currency || 'usd',
          customer: params.customer,
          mode: params.mode || 'payment',
          payment_status: 'unpaid',
          status: 'open',
          url: `https://checkout.stripe.com/pay/${sessionId}`,
          success_url: params.success_url,
          cancel_url: params.cancel_url,
          line_items: params.line_items,
          metadata: params.metadata || {},
          subscription: null,
          payment_intent: null
        };

        return session;
      },

      retrieve: async (sessionId: string) => {
        return {
          id: sessionId,
          object: 'checkout.session',
          created: Math.floor(Date.now() / 1000),
          payment_status: 'paid',
          status: 'complete',
          customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
          subscription: `sub_${Math.random().toString(36).substr(2, 9)}`
        };
      }
    }
  };

  // Subscriptions namespace
  subscriptions = {
    create: async (params: any) => {
      const subscriptionId = `sub_${Math.random().toString(36).substr(2, 9)}`;
      const subscription = {
        id: subscriptionId,
        object: 'subscription',
        created: Math.floor(Date.now() / 1000),
        customer: params.customer,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        items: {
          object: 'list',
          data: params.items?.map((item: any) => ({
            id: `si_${Math.random().toString(36).substr(2, 9)}`,
            object: 'subscription_item',
            created: Math.floor(Date.now() / 1000),
            price: this.mockPrices.get(item.price) || { id: item.price },
            quantity: item.quantity || 1,
            subscription: subscriptionId
          })) || []
        },
        metadata: params.metadata || {},
        latest_invoice: `in_${Math.random().toString(36).substr(2, 9)}`
      };

      this.mockSubscriptions.set(subscriptionId, subscription);
      return subscription;
    },

    retrieve: async (subscriptionId: string) => {
      const subscription = this.mockSubscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error(`No such subscription: ${subscriptionId}`);
      }
      return subscription;
    },

    update: async (subscriptionId: string, params: any) => {
      const subscription = this.mockSubscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error(`No such subscription: ${subscriptionId}`);
      }

      const updatedSubscription = { ...subscription, ...params };
      this.mockSubscriptions.set(subscriptionId, updatedSubscription);
      return updatedSubscription;
    },

    cancel: async (subscriptionId: string) => {
      const subscription = this.mockSubscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error(`No such subscription: ${subscriptionId}`);
      }

      const canceledSubscription = {
        ...subscription,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
        cancel_at_period_end: false
      };

      this.mockSubscriptions.set(subscriptionId, canceledSubscription);
      return canceledSubscription;
    }
  };

  // Products namespace
  products = {
    list: async (params: any = {}) => {
      const products = Array.from(this.mockProducts.values());
      return {
        object: 'list',
        data: products.slice(0, params.limit || 10),
        has_more: false,
        url: '/v1/products'
      };
    },

    retrieve: async (productId: string) => {
      const product = this.mockProducts.get(productId);
      if (!product) {
        throw new Error(`No such product: ${productId}`);
      }
      return product;
    }
  };

  // Prices namespace
  prices = {
    list: async (params: any = {}) => {
      let prices = Array.from(this.mockPrices.values());
      
      if (params.product) {
        prices = prices.filter(price => price.product === params.product);
      }

      return {
        object: 'list',
        data: prices.slice(0, params.limit || 10),
        has_more: false,
        url: '/v1/prices'
      };
    },

    retrieve: async (priceId: string) => {
      const price = this.mockPrices.get(priceId);
      if (!price) {
        throw new Error(`No such price: ${priceId}`);
      }
      return price;
    }
  };

  // Webhooks namespace for constructing events
  webhooks = {
    constructEvent: (payload: any, sig: string, secret: string) => {
      // Mock webhook event construction
      return {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: payload
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: `req_${Math.random().toString(36).substr(2, 9)}`,
          idempotency_key: null
        },
        type: payload.type || 'payment_intent.succeeded'
      };
    }
  };

  // Helper method to simulate errors
  simulateError(errorType: 'CARD_DECLINED' | 'INVALID_REQUEST' | 'API_ERROR' | 'AUTHENTICATION_ERROR') {
    const errors = {
      CARD_DECLINED: {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.',
        decline_code: 'generic_decline'
      },
      INVALID_REQUEST: {
        type: 'invalid_request_error',
        message: 'Invalid request: missing required parameter.'
      },
      API_ERROR: {
        type: 'api_error',
        message: 'An error occurred on our end. Please try again.'
      },
      AUTHENTICATION_ERROR: {
        type: 'authentication_error',
        message: 'Invalid API key provided.'
      }
    };

    const error = new Error(errors[errorType].message);
    Object.assign(error, errors[errorType]);
    throw error;
  }

  // Helper methods to manipulate mock data
  addMockCustomer(customerId: string, customerData: any) {
    this.mockCustomers.set(customerId, customerData);
  }

  addMockProduct(productId: string, productData: any) {
    this.mockProducts.set(productId, productData);
  }

  addMockPrice(priceId: string, priceData: any) {
    this.mockPrices.set(priceId, priceData);
  }

  clearMockData() {
    this.mockCustomers.clear();
    this.mockPaymentIntents.clear();
    this.mockSubscriptions.clear();
    this.initializeMockData(); // Reinitialize basic data
  }
}

export default StripeMock;
