import { NextRequest, NextResponse } from 'next/server';
import { routeSpecialty } from '@/lib/ai/service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();
    if (!description || description.length < 10) {
      return NextResponse.json({ error: 'Please provide a longer description' }, { status: 400 });
    }
    const result = await routeSpecialty(description);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('SecondOpinionRouteSpecialty', error);
    return NextResponse.json({ error: 'Failed to determine specialty' }, { status: 500 });
  }
}
