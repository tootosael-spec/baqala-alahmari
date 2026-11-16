const ACCESS_CHECK_URL = "https://szntskhngiyxhhddcesx.supabase.co/functions/v1/check-store-access?slug=baqala-alahmari";

const SUSPENDED_PAGE = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>المتجر غير متاح حالياً</title><body style="font-family:Tahoma,Arial,sans-serif;background:#f4f7f4;color:#24352a;display:grid;place-items:center;min-height:100vh;margin:0"><main style="background:#fff;border:1px solid #e1e9e2;border-radius:16px;padding:28px;max-width:420px;margin:18px;text-align:center"><h2>المتجر غير متاح حالياً</h2><p>يرجى التواصل مع إدارة المتجر لمعرفة حالة الاشتراك.</p></main></body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isMarketAlias =
      url.pathname === "/market" || url.pathname === "/market/";
    const isStorefrontPage =
      request.method === "GET" &&
      (url.pathname === "/" || url.pathname === "/index.html" || isMarketAlias);

    if (isStorefrontPage) {
      const accessCheckController = new AbortController();
      const accessCheckTimeout = setTimeout(() => accessCheckController.abort(), 1800);
      try {
        const check = await fetch(ACCESS_CHECK_URL, {
          method: "GET",
          headers: { "Accept": "application/json" },
          cache: "no-store",
          signal: accessCheckController.signal,
        });
        if (check.ok) {
          const access = await check.json();
          if (access.enforced === true && access.allowed === false) {
            return new Response(SUSPENDED_PAGE, {
              status: 503,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
              },
            });
          }
        }
      } catch (error) {
        // Fail open on errors or timeout to keep the storefront available.
      } finally {
        clearTimeout(accessCheckTimeout);
      }
    }

    // Serve the storefront at /market while keeping root and existing asset paths working.
    if (request.method === "GET" && isMarketAlias) {
      url.pathname = "/";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
