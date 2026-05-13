import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${API_URL}/ledger/contributions`, {
    headers: { Cookie: `access_token=${token}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
