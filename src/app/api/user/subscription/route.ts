import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId(session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Special users get Pro+ automatically
    const specialUsers = ['harshitkumar9030@gmail.com', 'mamtarani07275@gmail.com'];
    const isSpecialUser = specialUsers.includes(user.email);

    let subscription = user.subscription || null;

    // Override subscription for special users
    if (isSpecialUser) {
      subscription = {
        plan: 'proplus',
        status: 'active',
        stripeCustomerId: 'special_user',
        stripeSubscriptionId: 'special_subscription',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        cancelAtPeriodEnd: false
      };
    }

    return NextResponse.json({
      subscription,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
