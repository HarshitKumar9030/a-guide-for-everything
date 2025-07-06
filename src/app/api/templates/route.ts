import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';

    // Mock templates data - in real app, this would come from database
    const allTemplates = [
      {
        id: '1',
        name: 'Business Report Template',
        description: 'Professional business report with charts and analysis sections',
        category: 'business',
        isPremium: true,
        downloadCount: 1247,
        rating: 4.8,
        thumbnailUrl: null,
      },
      {
        id: '2',
        name: 'Course Material Template',
        description: 'Educational content template with lesson plans and exercises',
        category: 'education',
        isPremium: true,
        downloadCount: 892,
        rating: 4.6,
        thumbnailUrl: null,
      },
      {
        id: '3',
        name: 'Project Documentation',
        description: 'Complete project documentation template with technical specs',
        category: 'business',
        isPremium: true,
        downloadCount: 654,
        rating: 4.9,
        thumbnailUrl: null,
      },
      {
        id: '4',
        name: 'Personal Journal Template',
        description: 'Daily journal template with mood tracking and reflection prompts',
        category: 'personal',
        isPremium: false,
        downloadCount: 321,
        rating: 4.5,
        thumbnailUrl: null,
      },
      {
        id: '5',
        name: 'Technical Manual Template',
        description: 'Comprehensive technical documentation with code examples',
        category: 'technical',
        isPremium: true,
        downloadCount: 789,
        rating: 4.7,
        thumbnailUrl: null,
      },
      {
        id: '6',
        name: 'Training Workshop Template',
        description: 'Interactive workshop template with activities and assessments',
        category: 'education',
        isPremium: true,
        downloadCount: 456,
        rating: 4.4,
        thumbnailUrl: null,
      },
    ];

    const filteredTemplates = category === 'all' 
      ? allTemplates 
      : allTemplates.filter(template => template.category === category);

    return NextResponse.json({ templates: filteredTemplates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
