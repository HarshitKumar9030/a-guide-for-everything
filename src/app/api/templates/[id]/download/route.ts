import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;

    // Mock template data - in real app, this would come from database
    const templateContent = {
      id: templateId,
      name: `Template ${templateId}`,
      content: {
        sections: [
          {
            title: 'Introduction',
            content: 'This is a sample template content...',
          },
          {
            title: 'Main Content',
            content: 'Add your main content here...',
          },
          {
            title: 'Conclusion',
            content: 'Summarize your content...',
          },
        ],
      },
    };

    // Create downloadable JSON file
    const blob = JSON.stringify(templateContent, null, 2);
    
    return new Response(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="template-${templateId}.json"`,
      },
    });
  } catch (error) {
    console.error('Error downloading template:', error);
    return NextResponse.json(
      { error: 'Failed to download template' },
      { status: 500 }
    );
  }
}
