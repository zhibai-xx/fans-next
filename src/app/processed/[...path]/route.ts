import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
  'http://localhost:3000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  const path = pathSegments.join('/');
  const url = `${BACKEND_BASE_URL}/processed/${path}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'public, max-age=31536000', // 1 year cache for processed files
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
      },
    });
  } catch (error) {
    console.error(`Error proxying processed file ${url}:`, error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
