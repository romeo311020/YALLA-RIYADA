const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// الباقة المجانية في GNews = 100 طلب يوميًا، لذلك نحفظ النتيجة 30 دقيقة (حد أقصى 48 طلبًا في اليوم)
// ونعرض آخر نسخة محفوظة لو فشل المزوّد، ولا نرسل طلبين متزامنين.
const CACHE_MS = 30 * 60 * 1000;
let cachedArticles: { expiresAt: number; articles: Record<string, unknown>[] } | null = null;
let inflight: Promise<{ articles?: Record<string, unknown>[]; error?: string; status?: number }> | null = null;

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'طريقة الطلب غير مدعومة.' }, 405);

  const apiKey = Deno.env.get('GNEWS_API_KEY');
  if (!apiKey) return respond({ error: 'مفتاح خدمة الأخبار غير مضبوط في إعدادات الخادم.' }, 503);
  if (cachedArticles && cachedArticles.expiresAt > Date.now()) {
    return respond({ articles: cachedArticles.articles });
  }

  if (!inflight) {
    inflight = fetchNews(apiKey).finally(() => { inflight = null; });
  }
  const result = await inflight;
  if (result.articles) return respond({ articles: result.articles });
  if (cachedArticles) return respond({ articles: cachedArticles.articles }); // قديمة لكن أفضل من لا شيء
  return respond({ error: result.error ?? 'خطأ غير معروف.' }, result.status ?? 502);
});

async function fetchNews(apiKey: string) {
  const params = new URLSearchParams({ category: 'sports', lang: 'ar', max: '10', apikey: apiKey });
  try {
    const response = await fetch(`https://gnews.io/api/v4/top-headlines?${params}`, { signal: AbortSignal.timeout(10000) });
    const payload = await response.json();
    if (!response.ok || payload.errors) {
      console.error('GNews request rejected:', response.status, payload.errors ?? payload.message);
      return {
        error: response.status === 429 ? 'تم تجاوز حد طلبات الأخبار. حاول لاحقًا.' : 'تعذّر جلب الأخبار حاليًا.',
        status: response.status === 429 ? 429 : 502,
      };
    }
    const articles = (Array.isArray(payload.articles) ? payload.articles : [])
      .filter((article: Record<string, unknown>) => typeof article.title === 'string' && typeof article.url === 'string')
      .map((article: Record<string, unknown>) => {
        const source = article.source && typeof article.source === 'object' ? (article.source as Record<string, unknown>).name : null;
        return {
          title: article.title,
          description: typeof article.description === 'string' ? article.description : '',
          url: article.url,
          image: typeof article.image === 'string' ? article.image : null,
          publishedAt: typeof article.publishedAt === 'string' ? article.publishedAt : null,
          source: typeof source === 'string' ? source : 'مصدر إخباري',
        };
      });
    cachedArticles = { expiresAt: Date.now() + CACHE_MS, articles };
    return { articles };
  } catch (error) {
    console.error('GNews request failed:', error);
    return { error: 'تعذّر الاتصال بخدمة الأخبار. حاول مرة أخرى.', status: 502 };
  }
}
