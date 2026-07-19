import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { fetchSellingRates } from '@/lib/forex';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'DIRECTOR' && authUser.role !== 'FINANCE') {
      return NextResponse.json({ error: 'Forbidden: Restricted to Finance and Directors' }, { status: 403 });
    }

    const rates = await fetchSellingRates();
    return NextResponse.json({ rates });
  } catch (error: any) {
    console.error('Forex fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
