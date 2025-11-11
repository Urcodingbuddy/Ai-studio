import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from './lib/supabase/server';

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = url;

  if (!session && (pathname.startsWith('/explore') || pathname.startsWith('/images') || pathname.startsWith('/top') || pathname.startsWith('/likes'))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (session && (pathname === '/login' || pathname === '/signup')) {
    url.pathname = '/explore';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/explore',
    '/api/generations/:path*',
    '/login',
    '/signup',
  ],
};
