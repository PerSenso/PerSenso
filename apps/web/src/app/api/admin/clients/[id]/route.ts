import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${API_URL}/clients/${id}/detail`, {
    headers: { Cookie: `access_token=${token}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: { Cookie: `access_token=${token}` },
  });

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return new NextResponse(null, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
