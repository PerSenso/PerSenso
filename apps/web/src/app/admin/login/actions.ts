'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    redirect('/admin/login?error=missing');
  }

  const API_URL = process.env.API_URL || 'http://localhost:3001';

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      redirect('/admin/login?error=invalid');
    }

    const { accessToken, refreshToken } = await res.json();

    const cookieStore = await cookies();
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  } catch (error) {
    // If it's a redirect from above, rethrow it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    redirect('/admin/login?error=network');
  }

  redirect('/admin/dashboard');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  redirect('/admin/login');
}
