import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Plan configurations
export const STRIPE_PLANS = {
  pro: {
    monthly: {
      priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      amount: 1900, // $19.00
    },
    yearly: {
      priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
      amount: 19000, // $190.00
    },
  },
  proplus: {
    monthly: {
      priceId: process.env.STRIPE_PROPLUS_MONTHLY_PRICE_ID!,
      amount: 3900, // $39.00
    },
    yearly: {
      priceId: process.env.STRIPE_PROPLUS_YEARLY_PRICE_ID!,
      amount: 39000, // $390.00
    },
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;
export type BillingPeriod = 'monthly' | 'yearly';
