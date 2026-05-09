import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_ACCESS_SECRET),
    );
    return NextResponse.next();
  } catch {
    // Token expired or invalid → redirect to login
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }
}

export const config = {
  matcher: ['/admin/((?!login).*)'],
};
