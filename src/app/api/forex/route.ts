import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

const FALLBACK_RATES = {
  USD: 133.50,
  AUD: 89.20,
  CAD: 89.45,
  GBP: 168.50,
};

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'DIRECTOR' && authUser.role !== 'FINANCE') {
      return NextResponse.json({ error: 'Forbidden: Restricted to Finance and Directors' }, { status: 403 });
    }

    const toDate = new Date();
    const fromDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days window to ensure rates are captured
    const toStr = toDate.toISOString().split('T')[0];
    const fromStr = fromDate.toISOString().split('T')[0];

    const nrbUrl = `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=10&from=${fromStr}&to=${toStr}`;
    const res = await fetch(nrbUrl, { next: { revalidate: 3600 } }); // cache for 1 hour

    let rates: Record<string, number> = { ...FALLBACK_RATES };

    if (res.ok) {
      const json = await res.json();
      const payloads = json?.data?.payload || [];
      payloads.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const latestPayload = payloads[0];
      if (latestPayload?.rates) {
        latestPayload.rates.forEach((r: any) => {
          const iso = r.currency?.iso3?.toUpperCase();
          if (iso && ['USD', 'AUD', 'CAD', 'GBP'].includes(iso)) {
            const sellVal = parseFloat(r.sell);
            const unitVal = parseFloat(r.currency?.unit || '1');
            if (!isNaN(sellVal) && unitVal > 0) {
              rates[iso] = sellVal / unitVal;
            }
          }
        });
      }
    }

    return NextResponse.json({ rates });
  } catch (error: any) {
    console.error('Forex fetch error:', error);
    return NextResponse.json({ rates: FALLBACK_RATES });
  }
}
