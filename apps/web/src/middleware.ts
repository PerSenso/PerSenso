import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const API_URL = process.env.API_URL || 'http://localhost:3001';

function buildUpdatedCookieHeader(request: NextRequest, newAccessToken: string): string {
  const existing = request.headers.get('cookie') ?? '';
  const filtered = existing
    .split(';')
    .map((c) => c.trim())
    .filter((c) => !c.startsWith('access_token='))
    .join('; ');
  return filtered
    ? `${filtered}; access_token=${newAccessToken}`
    : `access_token=${newAccessToken}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
      await jwtVerify(accessToken, secret);
      return NextResponse.next();
    } catch {
      // Expirado o inválido — intentar refresh
    }
  }

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${refreshToken}` },
    });

    if (!refreshRes.ok) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await refreshRes.json();

    const isProduction = process.env.NODE_ENV === 'production';

    // Actualizar el header Cookie del request para que los Server Components
    // lean el nuevo access_token en esta misma request
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('cookie', buildUpdatedCookieHeader(request, newAccessToken));

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Persistir las nuevas cookies en el browser
    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
