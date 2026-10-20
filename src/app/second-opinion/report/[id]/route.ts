import { NextRequest, NextResponse } from 'next/server';
import { generateReportHtml, loadReportData, verifyReportToken } from '@/lib/second-opinion-report';

// GET /second-opinion/report/:id?t=<token> — the link emailed to the requester.
// Served as a standalone printable document so "Save as PDF" gives a clean report.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('t');

  if (!verifyReportToken(id, token)) {
    return new NextResponse('This report link is invalid. Please use the link from your email.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const data = await loadReportData(id);
  if (!data) {
    return new NextResponse('This report is not available yet.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new NextResponse(generateReportHtml(data), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
      // The only script on the page is the inline print button handler.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src-attr 'unsafe-inline'",
    },
  });
}
