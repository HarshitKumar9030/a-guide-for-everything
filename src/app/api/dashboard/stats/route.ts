import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    const { db } = await connectToDatabase();
    const userId = session.user.id;

    // Calculate date range
    const now = new Date();
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get user's guides
    const guides = await db.collection('guides').find({
      userId: userId,
      createdAt: { $gte: startDate }
    }).toArray();

    // Get user's activity logs
    const activities = await db.collection('user_activities').find({
      userId: userId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 }).limit(20).toArray();

    // Get user's usage data
    const usageData = await db.collection('user_usage').find({
      userId: userId,
      date: { $gte: startDate }
    }).toArray();

    // Calculate stats
    const totalGuides = guides.length;
    const totalViews = guides.reduce((sum, guide) => sum + (guide.views || 0), 0);
    const totalShares = guides.reduce((sum, guide) => sum + (guide.shares || 0), 0);
    const totalExports = guides.reduce((sum, guide) => sum + (guide.exports || 0), 0);

    // Generate weekly data
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayGuides = guides.filter(guide => 
        guide.createdAt >= dayStart && guide.createdAt <= dayEnd
      );
      
      const dayActivities = activities.filter(activity => 
        activity.timestamp >= dayStart && activity.timestamp <= dayEnd
      );

      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        guides: dayGuides.length,
        views: dayActivities.filter(a => a.type === 'view').length,
        exports: dayActivities.filter(a => a.type === 'export').length
      });
    }

    // Model usage data
    const modelUsageMap = new Map();
    usageData.forEach(usage => {
      if (usage.model) {
        modelUsageMap.set(usage.model, (modelUsageMap.get(usage.model) || 0) + (usage.count || 1));
      }
    });

    const modelUsage = Array.from(modelUsageMap.entries()).map(([model, count]) => ({
      model: model === 'gpt-4.1-full' ? 'GPT-4.1 Full' : 
             model === 'gpt-4.1-mini' ? 'GPT-4.1 Mini' : 
             model === 'gpt-4' ? 'GPT-4' : model,
      count
    }));

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthGuides = await db.collection('guides').countDocuments({
        userId: userId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      const monthViews = await db.collection('user_activities').countDocuments({
        userId: userId,
        type: 'view',
        timestamp: { $gte: monthStart, $lte: monthEnd }
      });

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        guides: monthGuides,
        engagement: monthViews
      });
    }

    // Recent activity
    const recentActivity = activities.map(activity => ({
      id: activity._id.toString(),
      type: activity.type,
      title: activity.guideTitle || activity.title || 'Unknown Activity',
      timestamp: activity.timestamp,
      model: activity.model || undefined
    }));

    const stats = {
      totalGuides,
      totalViews,
      totalShares,
      totalExports,
      weeklyData,
      modelUsage,
      monthlyTrends,
      recentActivity
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
