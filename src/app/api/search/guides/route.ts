import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

interface SearchResult {
    _id: string;
    title: string;
    preview: string;
    content: string;
    model: string;
    author: {
        name: string;
        email?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    views: number;
    relevanceScore?: number;
    highlightedTitle?: string;
    highlightedPreview?: string;
}

function highlightText(text: string, searchTerms: string[]): string {
    if (!text || searchTerms.length === 0) return text;
    
    let highlighted = text;
    searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
}

interface GuideDocument {
    _id: string;
    title: string;
    preview: string;
    content: string;
    model: string;
    author?: {
        name: string;
        email?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    views?: number;
}

function calculateRelevanceScore(guide: GuideDocument, searchTerms: string[]): number {
    let score = 0;
    const titleWeight = 3;
    const previewWeight = 2;
    const contentWeight = 1;
    
    const title = (guide.title || '').toLowerCase();
    const preview = (guide.preview || '').toLowerCase();
    const content = (guide.content || '').toLowerCase();
    
    searchTerms.forEach(term => {
        const termLower = term.toLowerCase();
        
        // Title matches (highest weight)
        const titleMatches = (title.match(new RegExp(termLower, 'g')) || []).length;
        score += titleMatches * titleWeight;
        
        // Preview matches
        const previewMatches = (preview.match(new RegExp(termLower, 'g')) || []).length;
        score += previewMatches * previewWeight;
        
        // Content matches (lowest weight)
        const contentMatches = (content.match(new RegExp(termLower, 'g')) || []).length;
        score += contentMatches * contentWeight;
    });
    
    return score;
}

function getDateFilter(dateRange: string): Date | null {
    const now = new Date();
    
    switch (dateRange) {
        case '1d':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default:
            return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const query = searchParams.get('q')?.trim();
        const model = searchParams.get('model');
        const dateRange = searchParams.get('dateRange');
        const sortBy = searchParams.get('sortBy') || 'relevance';
        const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 results per page
        
        if (!query || query.length < 2) {
            return NextResponse.json({
                success: false,
                error: 'Search query must be at least 2 characters long'
            }, { status: 400 });
        }
        
        const { db } = await connectToDatabase();
        
        // Build search terms
        const searchTerms = query.split(/\s+/).filter(term => term.length > 1);        // Build MongoDB aggregation pipeline
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pipeline: Record<string, any>[] = [
            // Match only public guides
            {
                $match: {
                    isPublic: true
                }
            }
        ];
        
        if (searchTerms.length > 0) {
            const searchRegex = searchTerms.map(term => 
                new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
            );
            
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $in: searchRegex } },
                        { preview: { $in: searchRegex } },
                        { content: { $in: searchRegex } }
                    ]
                }
            });
        }
        
        // Add model filter
        if (model && model !== 'All Models') {
            pipeline.push({
                $match: {
                    model: model
                }
            });
        }
        
        // Add date filter
        const dateFilter = getDateFilter(dateRange || '');
        if (dateFilter) {
            pipeline.push({
                $match: {
                    createdAt: { $gte: dateFilter }
                }
            });
        }
        
        // Add author lookup
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'author',
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            email: 1
                        }
                    }
                ]
            }
        });
        
        pipeline.push({
            $unwind: {
                path: '$author',
                preserveNullAndEmptyArrays: true
            }
        });
        
        pipeline.push({
            $addFields: {
                views: { $ifNull: ['$views', 0] }
            }
        });
        
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await db.collection('guides').aggregate(countPipeline).toArray();
        const totalResults = countResult[0]?.total || 0;
        let sortStage: Record<string, number> = {};
        
        switch (sortBy) {
            case 'date':
                sortStage = { createdAt: sortOrder === 'asc' ? 1 : -1 };
                break;
            case 'title':
                sortStage = { title: sortOrder === 'asc' ? 1 : -1 };
                break;
            case 'views':
                sortStage = { views: sortOrder === 'asc' ? 1 : -1 };
                break;
            case 'relevance':
            default:
                sortStage = { createdAt: -1 }; 
                break;
        }
        
        pipeline.push({ $sort: sortStage });
        
        // Add pagination
        const skip = (page - 1) * limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        
        pipeline.push({
            $project: {
                title: 1,
                preview: 1,
                content: 1,
                model: 1,
                author: 1,
                createdAt: 1,
                updatedAt: 1,
                isPublic: 1,
                views: 1
            }
        });
        
        // Execute the search
        const guides = await db.collection('guides').aggregate(pipeline).toArray();
          // Calculate relevance scores and add highlighting for client-side sorting
        const results: SearchResult[] = guides.map(guide => {
            const guideDoc = guide as GuideDocument;
            const relevanceScore = calculateRelevanceScore(guideDoc, searchTerms);
              return {
                _id: guideDoc._id.toString(),
                title: guideDoc.title,
                preview: guideDoc.preview,
                content: guideDoc.content,
                model: guideDoc.model,
                author: {
                    name: guideDoc.author?.name || 'Anonymous',
                    email: guideDoc.author?.email
                },
                createdAt: guideDoc.createdAt,
                updatedAt: guideDoc.updatedAt,
                isPublic: guideDoc.isPublic,
                views: guideDoc.views || 0,
                relevanceScore,
                highlightedTitle: highlightText(guideDoc.title, searchTerms),
                highlightedPreview: highlightText(guideDoc.preview, searchTerms)
            };
        });
        
        // Sort by relevance if requested
        if (sortBy === 'relevance') {
            results.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return (a.relevanceScore || 0) - (b.relevanceScore || 0);
                }
                return (b.relevanceScore || 0) - (a.relevanceScore || 0);
            });
        }
        
        const totalPages = Math.ceil(totalResults / limit);
        
        return NextResponse.json({
            success: true,
            data: {
                results,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalResults,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                query: {
                    q: query,
                    model,
                    dateRange,
                    sortBy,
                    sortOrder
                }
            }
        });
        
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error occurred while searching guides'
        }, { status: 500 });
    }
}
