export const FALLBACK_RATES: Record<string, number> = {
  USD: 133.50,
  AUD: 89.20,
  CAD: 89.45,
  GBP: 168.50,
};

export async function fetchSellingRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = { ...FALLBACK_RATES };

  // 1. Try to fetch from Nepal Rastra Bank's official API
  try {
    const toDate = new Date();
    const fromDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days window
    const toStr = toDate.toISOString().split('T')[0];
    const fromStr = fromDate.toISOString().split('T')[0];

    const nrbUrl = `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=10&from=${fromStr}&to=${toStr}`;
    const res = await fetch(nrbUrl, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const payloads = json?.data?.payload || [];
      payloads.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const latestPayload = payloads[0];
      if (latestPayload?.rates && latestPayload.rates.length > 0) {
        let foundAny = false;
        latestPayload.rates.forEach((r: any) => {
          const iso = r.currency?.iso3?.toUpperCase();
          if (iso && ['USD', 'AUD', 'CAD', 'GBP'].includes(iso)) {
            const sellVal = parseFloat(r.sell);
            const unitVal = parseFloat(r.currency?.unit || '1');
            if (!isNaN(sellVal) && unitVal > 0) {
              rates[iso] = sellVal / unitVal;
              foundAny = true;
            }
          }
        });
        if (foundAny) {
          return rates; // Successfully loaded from API
        }
      }
    }
  } catch (apiErr) {
    console.error('NRB API fetch error, attempting website scraping fallback:', apiErr);
  }

  // 2. Fallback: Parse directly from https://www.nrb.org.np/forex/ html structure
  try {
    const res = await fetch('https://www.nrb.org.np/forex/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const html = await res.text();
      // Regex to match table rows: captures currency iso (group 1), unit (group 2), buy (group 3), sell (group 4)
      const rowRegex = /<tr>\s*<td>[\s\S]*?<div[^>]*?>([a-zA-Z]{3})\s*<span[\s\S]*?<\/td>\s*<td>\s*(\d+)\s*<\/td>\s*<td>\s*([\d.]+)\s*<\/td>\s*<td>\s*([\d.]+)\s*<\/td>\s*<\/tr>/gi;
      
      let match;
      let foundAnyScraped = false;
      while ((match = rowRegex.exec(html)) !== null) {
        const iso = match[1].toUpperCase();
        if (['USD', 'AUD', 'CAD', 'GBP'].includes(iso)) {
          const unit = parseFloat(match[2]);
          const sell = parseFloat(match[4]);
          if (!isNaN(sell) && unit > 0) {
            rates[iso] = sell / unit;
            foundAnyScraped = true;
          }
        }
      }
      if (foundAnyScraped) {
        return rates; // Successfully loaded from scraped HTML
      }
    }
  } catch (scrapErr) {
    console.error('NRB scraping fallback error:', scrapErr);
  }

  return rates;
}
