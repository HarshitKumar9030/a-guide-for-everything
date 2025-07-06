import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const period = session.metadata?.period;

        if (userId && plan && period && session.subscription) {
          // Update user's subscription in database
          await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                subscription: {
                  stripeSubscriptionId: session.subscription,
                  stripeCustomerId: session.customer,
                  plan,
                  period,
                  status: 'active',
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + (period === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
                  updatedAt: new Date(),
                },
              },
            }
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                'subscription.status': subscription.status,
                'subscription.currentPeriodStart': new Date((subscription as any).current_period_start * 1000),
                'subscription.currentPeriodEnd': new Date((subscription as any).current_period_end * 1000),
                'subscription.updatedAt': new Date(),
              },
            }
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                'subscription.status': 'canceled',
                'subscription.updatedAt': new Date(),
              },
            }
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId) {
          // Update subscription status
          await db.collection('users').updateOne(
            { 'subscription.stripeSubscriptionId': subscriptionId },
            {
              $set: {
                'subscription.status': 'active',
                'subscription.updatedAt': new Date(),
              },
            }
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId) {
          await db.collection('users').updateOne(
            { 'subscription.stripeSubscriptionId': subscriptionId },
            {
              $set: {
                'subscription.status': 'past_due',
                'subscription.updatedAt': new Date(),
              },
            }
          );
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
