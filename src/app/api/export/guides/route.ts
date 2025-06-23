import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGuidesCollection } from '@/lib/guides-db';
import { getUserLimits, updateLastExport } from '@/lib/user-limits';
import { checkExportCooldown, getTimeUntilNextExport, formatTimeRemaining } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check export rate limit
    const userLimits = await getUserLimits(session.user.email!);
    
    if (!checkExportCooldown(userLimits.lastExport)) {
      const timeRemaining = getTimeUntilNextExport(userLimits.lastExport);
      const formattedTime = formatTimeRemaining(timeRemaining);
      
      return NextResponse.json(
        { 
          error: `You can export guides once every 6 hours. Please try again in ${formattedTime}.`,
          timeRemaining,
          canExportAt: userLimits.lastExport + (6 * 60 * 60 * 1000)
        },
        { status: 429 }
      );
    }

    const { sendEmail } = await req.json();
    
    const guides = await getGuidesCollection();
      // Fetch user's guides
    const userGuides = await guides.find({
      $or: [
        { userId: session.user.id },
        ...(session.user.email ? [{ userEmail: session.user.email }] : [])
      ]
    }).toArray();

    if (userGuides.length === 0) {
      return NextResponse.json(
        { error: 'No guides found to export' },
        { status: 404 }
      );
    }

    const csvHeaders = [
      'Title',
      'Prompt',
      'Model',
      'Privacy',
      'Views',
      'Created Date',
      'Updated Date',
      'Link'
    ];

    const csvRows = userGuides.map(guide => [
      `"${guide.title?.replace(/"/g, '""') || 'Untitled'}"`,
      `"${guide.prompt?.replace(/"/g, '""') || ''}"`,
      guide.model || '',
      guide.isPublic ? 'Public' : 'Private',
      guide.views || 0,
      guide.createdAt ? new Date(guide.createdAt).toISOString().split('T')[0] : '',
      guide.updatedAt ? new Date(guide.updatedAt).toISOString().split('T')[0] : '',
      `"https://agfe.tech/guide/${guide.id}"`
    ]);    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Update last export time before sending response
    await updateLastExport(session.user.email!);

    if (sendEmail) {
      try {
        const emailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/export/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session.user.email,
            csvContent,
            guideCount: userGuides.length
          }),
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to send email');
        }

        return NextResponse.json({
          success: true,
          message: 'Export sent to your email successfully!',
          guideCount: userGuides.length
        });
      } catch (error) {
        console.error('Email sending error:', error);
        // Fallback: return CSV for direct download
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="agfe-guides-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }
    } else {
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="agfe-guides-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

  } catch (error) {
    console.error('Export guides error:', error);
    return NextResponse.json(
      { error: 'Failed to export guides' },
      { status: 500 }
    );
  }
}
