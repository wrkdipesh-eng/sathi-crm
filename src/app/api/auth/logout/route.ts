import { NextRequest, NextResponse } from 'next/server';

function buildRedirect(req: NextRequest): NextResponse {
  const rawHost =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'localhost:3000';

  // Strip internal port (e.g. 127.0.0.1:3003 → 127.0.0.1)
  const host = rawHost.replace(/:\d+$/, '');
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  const protocol = isLocalhost ? 'http' : 'https';
  const port = isLocalhost ? ':3000' : '';

  const response = NextResponse.redirect(`${protocol}://${host}${port}/login`);
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}

export async function GET(req: NextRequest) {
  return buildRedirect(req);
}

export async function POST(req: NextRequest) {
  return buildRedirect(req);
}
