/* =====================================================================
   وَفِّرْهَا صَحّ — Bot + API  v6.4   (Cloudflare Worker)

   جديد في 6.4: قاعدة بيانات D1 للنقرات والزيارات وسجل الأسعار والتنبيهات والآراء
   - KV في الخطة المجانية يسمح بـ1000 كتابة يوميًا فقط، وكانت كل زيارة تستهلك 3 كتابات وكل نقرة كتابة،
     فيتوقف التسجيل (ومعه إضافة المنتجات من البوت) عند حوالي 300 زائر يوميًا. D1 يسمح بـ100 ألف كتابة يوميًا.
   - الجداول تُنشأ تلقائيًا. بدون الربط DB يعمل كل شيء على KV كما كان.
   - بعد ربط DB أرسل /migrate للبوت مرة واحدة لنقل البيانات القديمة من KV.
   - نسخة المنتجات المؤقتة صارت في الذاكرة وD1 بدل KV، ولا تُكتب أي بيانات لرسائل غير المدير.

   جديد في 6.3: حاجز إلزامي يمنع حفظ/نشر أي عنوان غير عربي، وترجمة المنتجات القديمة قبل إعادة النشر:
   - الاسم يُترجم إلى العربية قبل المعاينة، وفي المعاينة أزرار «✏️ عدّل الاسم» و«🔄 أعد الترجمة» ثم «✅ نشر»
   - ترجمة قوية بسلسلة بدائل: Workers AI (إن أضفت الربط AI) ← Google ← MyMemory، وإن فشلت كلها يبقى الاسم الأصلي لتعدّله بنفسك
   - الاسم الأصلي يُحفظ داخليًا في originalTitle للمقارنة والبحث فقط ولا يظهر في المعاينة أو المنشورات
   - أُلغيت فكرة «النشر مرتين»

   جديد في 6.0 (نتائج فحص v5.9):
   - الترجمة: فك رموز HTML (&quot; &#39;) من نتيجة MyMemory، وتحديد لغة المصدر تلقائيًا (وليس إنجليزي فقط)
   - مطابقة المنتجات بين المتاجر (مقارنة الأسعار) تستخدم الاسم الأصلي والمترجم معًا
   - البحث في البوت يشمل الاسم الأصلي (الإنجليزي) أيضًا
   - الصور: سقف 8 مرشحات لصور المنتج، ورفض الشعارات حتى للمتاجر غير المعروفة،
     وقبول صور Temu من مسار /product/ حتى بدون امتداد
   - واتساب: روابط القناة والمتجر تظهر دائمًا (تُستخدم الروابط الافتراضية إن لم تُضبط المتغيرات)

   جديد في 5.9: ترجمة عنوان المنتج إلى العربية، تنسيق منشور واتساب، إظهار السعر السابق في تيليجرام وX، وإيقاف التخمين العام للأسعار.

   جديد في 5.6:
   - قراءة روابط Temu وغيرها: نطلب الصفحة أولًا بهوية «زاحف المعاينة» (TelegramBot / facebookexternalhit)
     لأن المتاجر تعطيها وسوم og:image حتى لو حجبت المتصفحات، ثم نجرّب هوية المتصفح
   - إن لم تنجح القراءة المباشرة نجرّب خدمة المعاينة microlink.io كحل أخير (يمكن إيقافها: DISABLE_MICROLINK=true)
   - لا تُقبل الصورة إلا إن كانت صورة منتج حقيقية من نطاق صور المتجر (وليس شعارًا)
   - تجاهل العناوين العامة مثل «Temu: تسوّق كالمليادير» حتى لا تُحفظ كاسم منتج
   - إصلاح خطأ في رسالة «تم حفظ المنتج بنجاح» كان يظهر بعدها «حدث خطأ بعد الحفظ»

   جديد في 5.5: محاولة تعبئة اسم المنتج والسعر والسعر السابق تلقائيًا من بيانات الصفحة (JSON-LD ووسوم Meta والبيانات المضمنة)، مع الإبقاء على إدخال يدوي عند تعذّر الاستخراج.

   جديد في 5.2: رابط المنتج في منشور X هو الرابط الأصلي/التابع المحفوظ في product.link بدل رابط التتبع /go/:id.

   جديد في 5.0: النشر في X أصبح مجانيًا بمساعدة المستخدم: تجهيز النص والرابط وفتح محرر X؛ لا يستدعي API المدفوع.

   جديد في 4.6: لا يُحمَّل إلا صورة منتج موثوقة (من نطاق صور المتجر)، وإذا لم توجد يطلب الصورة منك بدل تحميل شعار المتجر

   جديد في 4.5: الإضافة تبدأ بالرابط وتحمّل صورة المنتج فقط بأعلى دقة

   جديد في 4.4: آراء العملاء عن المتجر (GET /api/reviews, POST /api/review + زر في لوحة الإدارة)

   جديد في 4.2 (إصلاحات): قراءة السعر والميتا، cleanNumber، guessCategory، مهلة للطلبات، قراءة products.json الكبيرة،
   حذف السعر السابق بإرسال -، حماية الأزرار القديمة، حماية فحص الأسعار.

   Bindings / Variables:
   - STATE          (KV Namespace)              مطلوب
   - DB             (D1 Database)               مستحسن — قاعدة البيانات (انظر worker/README.md)
   - BOT_TOKEN      (Secret)                    مطلوب
   - ADMIN_ID       (Variable)  يقبل أكثر من رقم بفاصلة
   - GITHUB_TOKEN   (Secret)
   - GITHUB_REPO    (Variable)  مثل user/repo
   - GITHUB_BRANCH  (Variable)  اختياري
   - PRODUCTS_PATH  (Variable)  اختياري (الافتراضي products.json)
   - WEBHOOK_SECRET (Secret)    اختياري
   - WORKER_URL     (Variable)  رابط الـWorker الكامل (مطلوب للكرون)
   - CHANNEL_LINK   (Variable)  اختياري — رابط قناة تلجرام يظهر في آخر المنشور
   - WHATSAPP_LINK  (Variable)  اختياري — رابط قناة واتساب يظهر في آخر المنشور
   - STORE_LINK     (Variable)  اختياري — رابط المتجر
   - SITE_URL       (Variable)  اختياري
   - CHANNEL_ID     (Variable)  اختياري — قناة تلجرام للنشر
   - WHAPI_TOKEN (Secret) / WHATSAPP_NEWSLETTER_ID (Variable)  اختياري — النشر في قناة واتساب
   - DISABLE_MICROLINK (Variable) اختياري — ضع true لإيقاف خدمة المعاينة الخارجية
   - AI (Workers AI binding) اختياري — يحسّن جودة الترجمة (Settings ← Bindings ← Add ← Workers AI، الاسم AI)
   - X_CLIENT_ID / X_CLIENT_SECRET / X_ACCESS_TOKEN / X_REFRESH_TOKEN / X_AUTO_POST  (اختياري)

   Cron Trigger (اختياري لفحص الأسعار): كل 6 ساعات

   المسارات:
   GET  /go/:id          يسجل النقرة ثم يحول لرابط الأفلييت
   GET  /api/trending    أكثر المنتجات نقرًا
   GET  /api/history?id= سجل سعر منتج
   POST /api/alert       تنبيه سعر (يتحقق من initData)
   GET  /api/reviews     آراء العملاء عن المتجر + المعدل
   POST /api/review      إضافة/تعديل رأي (يتحقق من initData): {initData, rating 1-5, comment}
   POST /api/visit       تسجيل زيارة مجهولة   |   GET /api/visit-stats   |   GET /api/budgets
   ===================================================================== */

const CATEGORY_ORDER = [
  ["shoes", "👟 الأحذية"], ["dresses", "👗 الفساتين"], ["accessories", "💍 الإكسسوارات"],
  ["perfumes", "🌸 العطور"], ["bags", "👜 الشنط"], ["watches", "⌚ الساعات"],
  ["electronics", "📱 الإلكترونيات"], ["home", "🏠 المنزل"], ["deals", "🔥 أقوى العروض"],
  ["beauty", "💄 العناية والجمال"], ["men", "👔 أزياء الرجال"], ["kids", "🧸 الأطفال"],
  ["sports", "🏋️ الرياضة"], ["gifts", "🎁 الهدايا"]
];
const CATEGORIES = Object.fromEntries(CATEGORY_ORDER);

const STORES = [
  ["Temu", /(^|\.)temu\.(to|com)$/i],
  ["Amazon", /(^|\.)(amazon\.[a-z.]+|amzn\.(to|eu|com))$/i],
  ["Noon", /(^|\.)noon\.com$/i],
  ["Shein", /(^|\.)shein\.[a-z.]+$|(^|\.)shein\.top$|(^|\.)shein\.page\.link$/i],
  ["AliExpress", /(^|\.)aliexpress\.[a-z.]+$|(^|\.)s\.click\.aliexpress\.com$/i],
  ["Trendyol", /(^|\.)trendyol\.com$|(^|\.)ty\.gl$/i]
];

/* كلمات لاقتراح القسم تلقائيًا */
const KEYWORDS = {
  shoes: ["حذاء", "احذيه", "سنيكرز", "صندل", "جزمه", "shoe", "sneaker", "boot"],
  dresses: ["فستان", "فساتين", "dress", "عباية", "abaya"],
  accessories: ["سوار", "خاتم", "عقد", "اكسسوار", "اقراط", "حلق", "ring", "necklace", "bracelet"],
  perfumes: ["عطر", "perfume", "بخور", "parfum", "oud"],
  bags: ["شنطه", "حقيبه", "bag", "backpack", "wallet", "محفظه"],
  watches: ["ساعه", "watch"],
  electronics: ["سماعه", "شاحن", "جوال", "هاتف", "لابتوب", "كيبل", "phone", "charger", "earbuds", "airpods", "speaker", "headphone", "headphones", "headset", "soundcore", "anker", "audio", "كاميرا", "tablet", "شاشه"],
  home: ["مطبخ", "منزل", "ديكور", "مفرش", "kitchen", "وساده", "سجاد", "اضاءه"],
  beauty: ["كريم", "سيروم", "مكياج", "شامبو", "عنايه", "makeup", "serum", "lipstick", "skin"],
  men: ["رجالي", "للرجال", "men", "ثوب", "قميص"],
  kids: ["اطفال", "طفل", "kids", "baby", "العاب", "لعبه", "toy"],
  sports: ["رياضه", "رياضي", "gym", "fitness", "yoga", "دمبل", "running"],
  gifts: ["هديه", "هدايا", "gift"]
};

const PAGE_SIZE = 8;
const STATE_TTL = 3600;
const REMOVE = "__remove__";
const MAX_IMAGE_CANDIDATES = 8;
const ADD_STEPS = new Set(["link", "image", "title", "price", "old", "category", "group", "preview"]);
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
/* هويات «زواحف المعاينة»: المتاجر تعطيها وسوم og:image حتى لو حجبت المتصفحات */
const SOCIAL_UAS = [
  "TelegramBot (like TwitterBot)",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Twitterbot/1.0"
];
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};

let ORIGIN = "";
const baseUrl = env => (env.WORKER_URL || ORIGIN || "").replace(/\/$/, "");
/* روابط القنوات والمتجر التي تظهر في المنشورات. يمكن تغييرها من متغيرات Cloudflare. */
const DEFAULT_CHANNEL_LINK = "https://t.me/Eramdeals";
const DEFAULT_WHATSAPP_LINK = "https://whatsapp.com/channel/0029VbDkz0vAojZ1Zn2KAO1m";
const DEFAULT_STORE_LINK = "https://aasa2841996-glitch.github.io/wafartha-sah/";
function footerLinks(env) {
  const out = [];
  const tgLink = env.CHANNEL_LINK || DEFAULT_CHANNEL_LINK;
  const waLink = env.WHATSAPP_LINK || DEFAULT_WHATSAPP_LINK;
  const storeLink = env.STORE_LINK || DEFAULT_STORE_LINK;
  if (tgLink) out.push(`📢 قناة تلجرام: ${tgLink}`);
  if (waLink) out.push(`💬 قناة واتساب: ${waLink}`);
  if (storeLink) out.push(`🛍️ متجرنا: ${storeLink}`);
  return out;
}
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", ...CORS } });

function pairRows(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += 2) out.push([rows[i][0], rows[i + 1]?.[0]].filter(Boolean));
  return out;
}

/* =========================
   Entry
========================= */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    ORIGIN = url.origin;
    const p = url.pathname;

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    try {
      if (request.method === "GET" && p === "/") return new Response(`Wafartha Sah Bot v6.4 ✅ — ${env.DB ? "D1" : "KV"}`);

      if (request.method === "GET" && p === "/set-webhook") {
        if (env.WEBHOOK_SECRET && url.searchParams.get("key") !== env.WEBHOOK_SECRET)
          return new Response("Forbidden", { status: 403 });
        const res = await telegram("setWebhook", {
          url: `${url.origin}/webhook`,
          ...(env.WEBHOOK_SECRET ? { secret_token: env.WEBHOOK_SECRET } : {}),
          allowed_updates: ["message", "callback_query"],
          drop_pending_updates: true
        }, env);
        return new Response(JSON.stringify(res, null, 2), { headers: { "content-type": "application/json" } });
      }

      if (request.method === "POST" && p === "/webhook") {
        if (env.WEBHOOK_SECRET && request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET)
          return new Response("Forbidden", { status: 403 });
        const update = await request.json();
        ctx.waitUntil(handleUpdate(update, env));
        return new Response("OK");
      }

      /* تتبع النقرة ثم التحويل */
      if (request.method === "GET" && p.startsWith("/go/")) {
        const id = decodeURIComponent(p.slice(4));
        const found = findProduct(await getProductsCached(env), id);
        if (!found?.product?.link) return new Response("Not found", { status: 404 });
        ctx.waitUntil(recordClick(env, found.product).catch(console.error));
        return Response.redirect(found.product.link, 302);
      }

      if (request.method === "GET" && p === "/api/trending") {
        const s = await getStats(env);
        const ids = Object.entries(s.c).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]);
        return json({ ids });
      }

      /* زيارات المتجر: إجمالي يومي دون تخزين عناوين IP */
      if (request.method === "POST" && p === "/api/visit") {
        const body = await request.json().catch(() => ({}));
        const sessionId = String(body.sessionId || "");
        if (!/^[a-zA-Z0-9_-]{16,80}$/.test(sessionId))
          return json({ ok: false, error: "invalid_session" }, 400);
        return json({ ok: true, counted: await recordVisit(env, sessionId) });
      }

      if (request.method === "GET" && p === "/api/visit-stats") {
        const days = Math.max(1, Math.min(30, Number(url.searchParams.get("days")) || 7));
        return json({ ok: true, ...(await visitStats(env, days)) });
      }

      /* منتجات أقسام الميزانية — مصدرها المنتجات الحالية في products.json */
      if (request.method === "GET" && p === "/api/budgets") {
        const products = await getProductsCached(env);
        const budgets = buildBudgetBuckets(products);
        return json({
          ok: true,
          currency: "SAR",
          updatedAt: new Date().toISOString(),
          total: budgets.reduce((sum, band) => sum + band.count, 0),
          budgets
        });
      }

      if (request.method === "GET" && p === "/api/history") {
        const id = url.searchParams.get("id") || "";
        return json({ points: id ? await getHistory(env, id) : [] });
      }

      if (request.method === "GET" && p === "/api/x/status") {
        return json({
          ok: true,
          configured: Boolean(env.X_CLIENT_ID && (env.X_ACCESS_TOKEN || env.X_REFRESH_TOKEN)),
          autoPost: String(env.X_AUTO_POST || "").toLowerCase() === "true"
        });
      }

      /* آراء العملاء عن المتجر */
      if (request.method === "GET" && p === "/api/reviews") {
        const list = await getReviews(env);
        return json({
          ...reviewsSummary(list),
          reviews: list.slice(-30).reverse().map(({ n, r, c, t }) => ({ n, r, c, t }))
        });
      }

      if (request.method === "POST" && p === "/api/review") {
        const body = await request.json().catch(() => ({}));
        const user = await verifyInitData(body.initData || "", env);
        const rating = Math.round(Number(body.rating));
        if (!(rating >= 1 && rating <= 5)) return json({ ok: false, error: "اختر تقييمًا من 1 إلى 5 نجوم" }, 400);
        const comment = String(body.comment || "").trim().slice(0, 300);
        if (!comment) return json({ ok: false, error: "اكتب رأيك قبل الإرسال" }, 400);

        // يقبل التقييم من Telegram أو من المتصفح، مع ربط تقييم المتصفح بعنوان IP بعد تجزئته.
        let identity, name;
        if (user?.id) {
          identity = `tg:${user.id}`;
          name = [user.first_name, (user.last_name || "").slice(0, 1)].filter(Boolean).join(" ").slice(0, 30) || "عميل";
        } else {
          const ip = request.headers.get("CF-Connecting-IP") || "";
          if (!ip) return json({ ok: false, error: "تعذر التحقق من الاتصال. حاول مرة أخرى." }, 400);
          const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
          const ipHash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
          identity = `web:${ipHash}`;
          name = String(body.name || "").trim().replace(/[<>]/g, "").slice(0, 30) || "زائر المتجر";
        }
        await saveReview(env, { u: identity, n: name, r: rating, c: comment, t: Date.now() }, String(user?.id || ""));
        ctx.waitUntil(notifyAdminReview(env, name, rating, comment).catch(console.error));
        return json({ ok: true });
      }

      if (request.method === "POST" && p === "/api/alert") {
        const body = await request.json().catch(() => ({}));
        const user = await verifyInitData(body.initData || "", env);
        if (!user?.id) return json({ ok: false, error: "افتح التطبيق من داخل تلجرام" }, 401);
        const target = Number(body.target);
        if (!(target > 0) || !body.id) return json({ ok: false, error: "بيانات غير صحيحة" }, 400);
        const found = findProduct(await getProductsCached(env), String(body.id));
        if (!found) return json({ ok: false, error: "المنتج غير موجود" }, 404);
        await addAlert(env, found.product.id, user.id, target);
        let dm = true;
        try {
          await sendMessage(user.id,
            `🔔 تم تفعيل تنبيه السعر\n\n${found.product.title}\nالسعر الحالي: ${found.product.price} ريال\nسنخبرك عندما يصل إلى ${target} ريال أو أقل.`, env);
        } catch { dm = false; }
        return json({ ok: true, dm });
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error(error);
      return new Response("Internal error", { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkPrices(env).catch(console.error));
    ctx.waitUntil(cleanupDb(env).catch(console.error));
  }
};

/* =========================
   Telegram
========================= */

async function telegram(method, data, env) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok || !result.ok) throw new Error(`Telegram ${method} failed: ${JSON.stringify(result)}`);
  return result;
}

const sendMessage = (chatId, text, env, extra = {}) =>
  telegram("sendMessage", { chat_id: chatId, text, disable_web_page_preview: true, ...extra }, env);

async function answerCallback(id, env, text = "") {
  try { await telegram("answerCallbackQuery", { callback_query_id: id, text }, env); } catch (e) { console.error(e); }
}

/* إرسال صورة كملف مرفوع (بدون الاعتماد على رابط خارجي) */
async function telegramSendPhotoFile(chatId, bytes, ext, caption, markup, env) {
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  if (markup) form.append("reply_markup", JSON.stringify(markup));
  form.append("photo", new Blob([bytes], { type: mime }), `product.${ext}`);
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: form
  });
  const result = await res.json();
  if (!res.ok || !result.ok) throw new Error(`Telegram sendPhoto failed: ${JSON.stringify(result)}`);
  return result;
}

/* تعديل الرسالة الحالية وإن تعذر نرسل رسالة جديدة */
async function ui(ref, text, buttons, env) {
  const reply_markup = buttons ? { inline_keyboard: buttons } : undefined;
  if (ref.messageId) {
    try {
      await telegram("editMessageText", {
        chat_id: ref.chatId, message_id: ref.messageId, text, reply_markup, disable_web_page_preview: true
      }, env);
      return;
    } catch (e) {
      if (String(e).includes("message is not modified")) return;
    }
  }
  await sendMessage(ref.chatId, text, env, reply_markup ? { reply_markup } : {});
}

async function downloadTelegramImage(fileId, env) {
  const info = await telegram("getFile", { file_id: fileId }, env);
  const res = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${info.result.file_path}`);
  if (!res.ok) throw new Error(`Telegram file download failed: ${res.status}`);
  const ext = (info.result.file_path.split(".").pop() || "jpg").toLowerCase();
  return {
    bytes: new Uint8Array(await res.arrayBuffer()),
    ext: ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg"
  };
}

/* يحوّل رابط صورة مصغّرة إلى النسخة الأعلى دقة حسب نمط كل متجر */
function upgradeImageUrl(url) {
  let u = String(url);
  try {
    const x = new URL(u);
    const h = x.hostname;
    if (/alicdn\.com$/i.test(h)) return u.replace(/(\.(?:jpe?g|png|webp))_[^/]*$/i, "$1");
    if (/media-amazon\.com$/i.test(h)) return u.replace(/\._[A-Za-z0-9,_\-]+_\.(jpe?g|png|webp)/i, ".$1");
    if (/kwcdn\.com$/i.test(h) || /nooncdn\.com$/i.test(h)) { x.search = ""; return x.href; }
    if (/ltwebstatic\.com$/i.test(h)) return u.replace(/_thumbnail_[^./]*/i, "");
  } catch { /* ignore */ }
  return u;
}

/* تحميل صورة من رابط خارجي بأعلى جودة متاحة */
async function downloadRemoteImage(url) {
  let referer = "";
  try { referer = new URL(url).origin + "/"; } catch { /* ignore */ }
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "image/*", ...(referer ? { referer } : {}) },
    redirect: "follow",
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error(`Image HTTP ${res.status}`);
  const type = (res.headers.get("content-type") || "").toLowerCase();
  if (!type.startsWith("image/")) throw new Error("Not an image");
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length < 2000 || buf.length > 8_000_000) throw new Error("Bad image size");
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  return { bytes: buf, ext };
}

/* نجرّب النسخة الأعلى دقة أولًا ثم الرابط الأصلي، ونعتمد الأكبر حجمًا */
async function downloadBestImage(url) {
  const hi = upgradeImageUrl(url);
  const tries = hi !== url ? [hi, url] : [url];
  let best = null, lastErr;
  for (const u of tries) {
    try {
      const img = await downloadRemoteImage(u);
      if (!best || img.bytes.length > best.bytes.length) best = img;
      if (u === hi) break; // نجحت النسخة عالية الدقة
    } catch (e) { lastErr = e; }
  }
  if (!best) throw lastErr || new Error("Image download failed");
  return best;
}

const base64ToBytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

/* الصورة التي حمّلناها من الرابط وحفظناها مؤقتًا أثناء الإضافة */
async function loadStagedImage(userId, draft, env) {
  if (!draft.has_img) return null;
  const raw = await env.STATE.get(`img:${userId}`);
  if (!raw) return null;
  return { bytes: base64ToBytes(raw), ext: draft.image_ext || "jpg" };
}

function extractImageFileId(message) {
  if (message.photo?.length) return message.photo[message.photo.length - 1].file_id;
  if (message.document?.mime_type?.startsWith("image/")) return message.document.file_id;
  return null;
}

/* =========================
   State (KV)
========================= */

async function getState(userId, env) {
  const raw = await env.STATE.get(`state:${userId}`);
  return raw ? JSON.parse(raw) : null;
}
const saveState = (userId, state, env) =>
  env.STATE.put(`state:${userId}`, JSON.stringify(state), { expirationTtl: STATE_TTL });
const clearState = (userId, env) => Promise.all([env.STATE.delete(`state:${userId}`), env.STATE.delete(`img:${userId}`)]);

async function isDuplicateUpdate(update, env) {
  const key = `upd:${update.update_id}`;
  if (await env.STATE.get(key)) return true;
  await env.STATE.put(key, "1", { expirationTtl: 300 });
  return false;
}

/* =========================
   GitHub
========================= */

const ghBase = env => `https://api.github.com/repos/${env.GITHUB_REPO}/contents`;
const ghBranch = env => env.GITHUB_BRANCH || "";
const productsPath = env => env.PRODUCTS_PATH || "products.json";

function ghFetch(env, path, init = {}) {
  const method = init.method || "GET";
  const query = method === "GET" && ghBranch(env) ? `?ref=${ghBranch(env)}` : "";
  return fetch(`${ghBase(env)}/${path}${query}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "wafartha-admin-bot",
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
}

/* قراءة ملف (صورة أو نص) من الريبو مباشرة — يعمل أيضًا للملفات الأكبر من 1MB */
async function readRepoBytes(env, path) {
  const res = await ghFetch(env, path, {
    method: "GET",
    headers: { Accept: "application/vnd.github.raw+json" }
  });
  if (!res.ok) throw new Error(`GitHub raw read failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}
const readRepoImage = readRepoBytes;

function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const base64ToText = b64 =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), c => c.charCodeAt(0)));

async function githubPut(env, path, base64, message, sha) {
  const res = await ghFetch(env, path, {
    method: "PUT",
    body: JSON.stringify({
      message, content: base64,
      ...(ghBranch(env) ? { branch: ghBranch(env) } : {}),
      ...(sha ? { sha } : {})
    })
  });
  if (!res.ok) {
    const err = new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const githubUploadBinary = (path, bytes, message, env) =>
  githubPut(env, path, bytesToBase64(bytes), message);

async function githubDeleteFile(path, env) {
  if (!path || /^https?:\/\//i.test(path)) return;
  try {
    const res = await ghFetch(env, path, { method: "GET" });
    if (!res.ok) return;
    const { sha } = await res.json();
    await ghFetch(env, path, {
      method: "DELETE",
      body: JSON.stringify({ message: `Delete ${path}`, sha, ...(ghBranch(env) ? { branch: ghBranch(env) } : {}) })
    });
  } catch (e) { console.error("deleteFile failed", e); }
}

/* =========================
   Products
========================= */

async function readProducts(env) {
  const res = await ghFetch(env, productsPath(env), { method: "GET" });
  let data = {}, sha;
  if (res.status === 404) {
    /* سيتم إنشاء الملف عند أول منتج */
  } else if (!res.ok) {
    throw new Error(`GitHub read failed: ${res.status}`);
  } else {
    const file = await res.json();
    sha = file.sha;
    /* الملفات الأكبر من 1MB يرجع content فارغًا — نقرأها كملف خام */
    const text = file.content
      ? base64ToText(file.content)
      : new TextDecoder().decode(await readRepoBytes(env, productsPath(env)));
    data = JSON.parse(text);
  }
  for (const [key] of CATEGORY_ORDER) if (!Array.isArray(data[key])) data[key] = [];
  return { data, sha };
}

const getProducts = async env => (await readProducts(env)).data;

/* نسخة مؤقتة لتخفيف الضغط على GitHub (للنقرات والـAPI):
   الذاكرة أولًا (60 ثانية) ثم D1 أو KV (120 ثانية) ثم GitHub */
let memProducts = null, memProductsAt = 0;

async function getProductsCached(env) {
  if (memProducts && Date.now() - memProductsAt < 60000) return memProducts;
  const d1 = await db(env);
  const raw = d1
    ? (await d1.prepare("SELECT v FROM meta WHERE k = 'pc:data' AND exp > ?").bind(Date.now()).first())?.v
    : await env.STATE.get("pc:data");
  let data;
  if (raw) data = JSON.parse(raw);
  else {
    data = await getProducts(env);
    try {
      if (d1) await d1.prepare("INSERT OR REPLACE INTO meta (k, v, exp) VALUES ('pc:data', ?, ?)").bind(JSON.stringify(data), Date.now() + 120000).run();
      else await env.STATE.put("pc:data", JSON.stringify(data), { expirationTtl: 120 });
    } catch (e) { console.error("cache put failed", e); } /* حد الصف في D1 2MB وحد القيمة في KV 25MB */
  }
  memProducts = data; memProductsAt = Date.now();
  return data;
}

async function invalidateProductsCache(env) {
  memProducts = null;
  const d1 = await db(env);
  if (d1) await d1.prepare("DELETE FROM meta WHERE k = 'pc:data'").run();
  else await env.STATE.delete("pc:data");
}

/* حفظ آمن مع إعادة المحاولة */
async function updateProducts(env, mutator, message = "Update products") {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { data, sha } = await readProducts(env);
    const result = mutator(data);
    try {
      await githubPut(env, productsPath(env),
        bytesToBase64(new TextEncoder().encode(JSON.stringify(data, null, 2))), message, sha);
      await invalidateProductsCache(env);
      return result;
    } catch (e) {
      if ((e.status === 409 || e.status === 422) && attempt < 4) {
        await new Promise(r => setTimeout(r, 300 * attempt));
        continue;
      }
      throw e;
    }
  }
}

function findProduct(products, id) {
  for (const [category] of CATEGORY_ORDER) {
    const product = products[category]?.find(p => String(p.id) === String(id));
    if (product) return { category, product };
  }
  return null;
}

function allProducts(products) {
  const out = [];
  for (const [category] of CATEGORY_ORDER)
    for (const product of products[category] || []) out.push({ category, product });
  return out;
}

/* تقسيم المنتجات تلقائيًا حسب السعر — لا ينقل المنتج من قسمه الأصلي */
function buildBudgetBuckets(products) {
  const active = allProducts(products)
    .filter(({ product: p }) => !p.expired && Number.isFinite(Number(p.price)) && Number(p.price) > 0)
    .map(({ category, product }) => ({ ...product, category, price: Number(product.price) }));

  const bands = [
    { id: "under50", title: "أقل من 50 ريال", min: 0, max: 50, minInclusive: false, maxInclusive: false },
    { id: "50to100", title: "من 50 إلى أقل من 100 ريال", min: 50, max: 100, minInclusive: true, maxInclusive: false },
    { id: "100to500", title: "من 100 إلى أقل من 500 ريال", min: 100, max: 500, minInclusive: true, maxInclusive: false },
    { id: "500to1000", title: "من 500 إلى أقل من 1000 ريال", min: 500, max: 1000, minInclusive: true, maxInclusive: false },
    { id: "1000to5000", title: "من 1000 إلى 5000 ريال", min: 1000, max: 5000, minInclusive: true, maxInclusive: true },
    { id: "over5000", title: "أكثر من 5000 ريال", min: 5000, max: Infinity, minInclusive: false, maxInclusive: false }
  ];

  return bands.map(band => ({
    id: band.id,
    title: band.title,
    count: active.filter(p =>
      (band.minInclusive ? p.price >= band.min : p.price > band.min) &&
      (band.maxInclusive ? p.price <= band.max : p.price < band.max)
    ).length,
    products: active
      .filter(p =>
        (band.minInclusive ? p.price >= band.min : p.price > band.min) &&
        (band.maxInclusive ? p.price <= band.max : p.price < band.max)
      )
      .sort((a, b) => a.price - b.price)
  }));
}

/* =========================
   Utilities
========================= */

function cleanNumber(input) {
  if (typeof input !== "string") return null;
  let s = input
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/٫/g, ".")
    .replace(/[٬،]/g, ",")
    .replace(/[^\d.,]/g, "");
  const lc = s.lastIndexOf(","), ld = s.lastIndexOf(".");
  if (lc > -1 && ld > -1) {
    /* الأخير منهما هو الفاصلة العشرية: 1,299.00 أو 1.299,00 */
    s = lc > ld ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lc > -1) {
    /* 1,299 أو 1,299,000 = آلاف — وإلا 69,5 = عشري */
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? String(n) : null;
}

function isValidUrl(value) {
  try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:"; }
  catch { return false; }
}

function normalizeText(text = "") {
  return String(text).toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").trim();
}

function detectStore(link) {
  try {
    const host = new URL(link).hostname;
    return STORES.find(([, re]) => re.test(host))?.[0] || "";
  } catch { return ""; }
}

const calcDiscount = (price, old) =>
  Number(old) > 0 && Number(price) < Number(old)
    ? Math.round((1 - Number(price) / Number(old)) * 100) : 0;

const shortId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

function guessCategory(title) {
  const t = normalizeText(title);
  let best = "", score = 0;
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    const s = words.filter(w => {
      const nw = normalizeText(w);
      /* الإنجليزية: بداية كلمة فقط (men لا تطابق women) — العربية: احتواء */
      return /^[a-z]+$/.test(nw) ? new RegExp(`\\b${nw}`).test(t) : t.includes(nw);
    }).length;
    if (s > score) { best = cat; score = s; }
  }
  return best;
}

/* تشابه العناوين لاقتراح مقارنة الأسعار بين المتاجر */
const tokens = t => new Set(normalizeText(t).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1));
function similarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / (A.size + B.size - i);
}

/* نقارن العنوان المترجم والأصلي معًا ونأخذ الأعلى (حتى لو ترجمة منتجين مختلفة قليلًا) */
function bestSimilarity(titleA, originalA, titleB, originalB) {
  const as = [titleA, originalA].filter(Boolean);
  const bs = [titleB, originalB].filter(Boolean);
  let best = 0;
  for (const a of as) for (const b of bs) best = Math.max(best, similarity(a, b));
  return best;
}

function similarTo(products, title, store, excludeId, min, limit, originalTitle = "") {
  return allProducts(products)
    .filter(({ product: p }) =>
      !p.expired && String(p.id) !== String(excludeId) &&
      (p.store || "").toLowerCase() !== (store || "").toLowerCase())
    .map(x => ({ ...x, sim: bestSimilarity(title, originalTitle, x.product.title, x.product.originalTitle) }))
    .filter(x => x.sim >= min)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit);
}

const groupOf = (products, p) =>
  p.groupId ? allProducts(products).map(x => x.product).filter(x => x.groupId === p.groupId && !x.expired) : [p];

/* =========================
   Deal Score
========================= */

function dealScore(p) {
  if (p.expired) return 0;
  const discount = Number(p.discount) || 0;
  const featured = p.featured ? 20 : 0;
  let fresh = 0;
  if (p.createdAt) {
    const age = Date.now() - new Date(p.createdAt).getTime(), day = 86400000;
    fresh = age <= day ? 15 : age <= 3 * day ? 10 : age <= 7 * day ? 5 : 0;
  }
  return discount + featured + fresh;
}

const getTopDeals = products =>
  allProducts(products).filter(({ product }) => !product.expired)
    .sort((a, b) => dealScore(b.product) - dealScore(a.product));

const getFeaturedProducts = products =>
  getTopDeals(products).filter(({ product }) => product.featured);

function productCard(p, offers = []) {
  const badges = [p.featured ? "⭐ مميز" : "", p.expired ? "⛔ منتهي" : ""].filter(Boolean).join(" • ");
  const score = dealScore(p);
  let text =
    `${p.title}\n\n💰 السعر: ${p.price} ريال\n🏷️ السابق: ${p.old ?? "-"}${p.old ? " ريال" : ""}` +
    (p.discount ? `\n🔻 الخصم: ${p.discount}%` : "") +
    (p.store ? `\n🏬 المتجر: ${p.store}` : "") +
    (score > 0 ? `\n🔥 قوة العرض: ${score}` : "") +
    (badges ? `\n${badges}` : "");
  const others = offers.filter(o => o.id !== p.id);
  if (others.length)
    text += `\n\n🔁 نفس المنتج في متاجر أخرى:\n` +
      others.map(o => `• ${o.store || "؟"}: ${o.price} ريال`).join("\n");
  return text;
}

/* =========================
   Scraping (قراءة بيانات الرابط)
========================= */

/* mode = "browser": هوية متصفح فقط (لفحص الأسعار)
   mode = "social": نبدأ بهويات زواحف المعاينة ثم المتصفح (لقراءة صورة المنتج) */
async function fetchPage(url, mode = "browser") {
  const agents = mode === "social" ? [...SOCIAL_UAS, UA] : [UA];
  let best = null;
  for (const agent of agents) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: {
          "user-agent": agent,
          accept: "text/html,application/xhtml+xml",
          "accept-language": "ar-SA,ar;q=0.9,en;q=0.8"
        }
      });
      const html = (await res.text()).slice(0, 700000);
      const page = { finalUrl: res.url || url, status: res.status, html, agent };
      if (!best || (res.status < 400 && best.status >= 400)) best = page;
      /* نكتفي بأول رد سليم يحتوي بيانات المعاينة أو بيانات المنتج */
      if (res.status < 400 && /og:image|twitter:image|application\/ld\+json/i.test(html)) return page;
    } catch (e) {
      console.error("fetchPage", agent.slice(0, 20), String(e?.message || e).slice(0, 120));
    }
  }
  if (!best) throw new Error("fetchPage failed for all user agents");
  return best;
}

/* حل أخير: خدمة معاينة خارجية (microlink.io) تفتح الصفحة بمتصفح حقيقي */
async function fetchViaMicrolink(url) {
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`microlink ${res.status}`);
  const j = await res.json();
  if (j.status !== "success") throw new Error("microlink " + String(j.status || "failed"));
  const d = j.data || {};
  return { title: String(d.title || ""), image: String(d.image?.url || ""), finalUrl: String(d.url || url) };
}

const decodeEntities = s =>
  String(s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

function jsonLdProducts(html) {
  const out = [];
  const walk = n => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(walk);
    if ([].concat(n["@type"] || []).includes("Product")) out.push(n);
    if (n["@graph"]) walk(n["@graph"]);
  };
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) { try { walk(JSON.parse(m[1].trim())); } catch { /* ignore */ } }
  return out;
}

/* صور الشعارات والأيقونات العامة (ليست صورة المنتج) */
const BAD_IMG = /logo|favicon|sprite|placeholder|default[-_]?(image|share|og)|og[-_]?default|brand|icon|banner|apple-touch|\.svg(\?|$)/i;

/* هل الرابط صورة منتج حقيقية من نطاق صور أحد المتاجر؟ (وليس شعارًا أو صورة عامة) */
function isProductImageUrl(value) {
  try {
    const u = new URL(String(value));
    if (!/^https?:$/.test(u.protocol) || BAD_IMG.test(u.href)) return false;
    const h = u.hostname, p = u.pathname;
    if (/(^|\.)alicdn\.com$/i.test(h)) return /\/kf\//i.test(p);
    /* Temu: مسار /product/ كافٍ (بعض الروابط بلا امتداد)، وبقية المسارات تحتاج امتداد صورة */
    if (/(^|\.)kwcdn\.com$/i.test(h))
      return /\/product\//i.test(p) || (/\/(?:goods|image|images|goods_images)\//i.test(p) && /\.(?:jpe?g|png|webp|avif)$/i.test(p));
    if (/(^|\.)media-amazon\.com$/i.test(h)) return /\/images\/I\//i.test(p);
    if (/(^|\.)nooncdn\.com$/i.test(h)) return /\/p\//i.test(p);
    if (/(^|\.)ltwebstatic\.com$/i.test(h)) return true;
    if (/(^|\.)dsmcdn\.com$/i.test(h)) return true;
    return false;
  } catch { return false; }
}

/* عناوين عامة للمتجر نفسه وليست اسم منتج (مثل «Temu: تسوّق كالمليادير») */
function isGenericTitle(t) {
  const s = String(t || "").trim();
  if (!s) return true;
  if (/shop like a billionaire|تسوّق كالمليادير|تسوق كالمليادير|تسوّق كالملياردير|تسوق كالملياردير/i.test(s)) return true;
  if (s.length < 70 && /^(temu|shein|aliexpress|amazon|noon|trendyol)\s*[:|\-–—]/i.test(s)) return true;
  if (/^(temu|shein|aliexpress|amazon(\.[a-z.]+)?|noon(\.com)?|trendyol)$/i.test(s)) return true;
  return false;
}

/* نبحث عن صورة المنتج الحقيقية من نطاق صور المتجر نفسه (لأن og:image غالبًا شعار المتجر) */
function siteProductImage(html, baseLink) {
  let host = "";
  try { host = new URL(baseLink).hostname; } catch { /* ignore */ }
  const text = html.replace(/\\u002F/gi, "/").replace(/\\\//g, "/");
  const sets = [];
  if (/aliexpress|alicdn/i.test(host) || /alicdn\.com\/kf\//i.test(text))
    sets.push(/https?:\/\/[\w.-]*alicdn\.com\/kf\/[\w\-.]+?\.(?:jpe?g|png|webp)/i);
  if (/amazon|amzn/i.test(host))
    sets.push(/https:\/\/m\.media-amazon\.com\/images\/I\/[\w%\-.]+?\.(?:jpe?g|png)/i);
  if (/noon/i.test(host))
    sets.push(/https:\/\/f\.nooncdn\.com\/p\/[\w\/\-.]+?\.(?:jpe?g|png|webp)/i);
  if (/temu/i.test(host))
    sets.push(/https?:\/\/[\w.-]*kwcdn\.com\/product\/[\w%\/\-.]+?\.(?:jpe?g|png|webp)(?:\?[^\s"'<>\\]*)?/i);
  if (/shein/i.test(host))
    sets.push(/https?:\/\/img\.ltwebstatic\.com\/[\w\/\-.]+?\.(?:jpe?g|png|webp)/i);
  for (const re of sets) {
    const m = text.match(re);
    if (m && !BAD_IMG.test(m[0])) return m[0];
  }
  return "";
}

function extractMeta(html, baseLink) {
  /* قراءة وسوم meta مع دعم " و ' داخل المحتوى (مثل Men's) وأي ترتيب للخصائص */
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  const meta = prop => {
    for (const tag of metaTags) {
      const key = tag.match(/\s(?:property|name|itemprop)\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      if (!key || String(key[1] ?? key[2]).toLowerCase() !== prop.toLowerCase()) continue;
      const c = tag.match(/\scontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      if (c) return decodeEntities(c[1] ?? c[2] ?? "");
    }
    return "";
  };
  const firstVal = (...vals) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== "");

  const ld = jsonLdProducts(html)[0] || {};
  const offer = [].concat(ld.offers || [])[0] || {};

  let title = decodeEntities(ld.name || "") || meta("og:title") || meta("twitter:title") ||
    decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  title = title.replace(/\s*[|\-–—]\s*(Amazon|Noon|Temu|AliExpress|SHEIN|Trendyol)[^|]*$/i, "").trim().slice(0, 150);
  if (/robot|captcha|access denied|just a moment|attention required|verify you|are you a human|تحقق/i.test(title)) title = "";
  if (isGenericTitle(title)) title = "";

  const normImg = v => {
    if (v && typeof v === "object") v = v.url || "";
    try { return v ? new URL(String(v), baseLink).href : ""; } catch { return ""; }
  };
  /* صورة موثوقة = من نطاق صور المتجر أو من بيانات المنتج (JSON-LD). أما og:image فغالبًا شعار المتجر */
  const ldImage = normImg([].concat(ld.image || [])[0]);
  const ogImage = [meta("og:image"), meta("twitter:image")].map(normImg).filter(u => u && !BAD_IMG.test(u))[0] || "";
  const siteImg = siteProductImage(html, baseLink);
  /* og:image موثوقة فقط إذا كانت من نطاق صور منتجات المتجر (kwcdn/product، alicdn/kf، ...) */
  const ogTrusted = ogImage && isProductImageUrl(ogImage) ? ogImage : "";

  /* للمتاجر غير الستة المعروفة فقط: نقبل صورة عامة تبدو كصورة منتج.
     أما المتاجر المعروفة فنشترط نطاق صور المنتجات حتى لا يُقبل الشعار. */
  let trustedMetaImage = "";
  let baseHost = "";
  try { baseHost = new URL(baseLink).hostname.replace(/^www\./i, ""); } catch { /* ignore */ }
  if (!detectStore(baseLink)) {
    const imageCandidates = [ldImage, ogImage];
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    for (const tag of imgTags.slice(0, 80)) {
      const attr = tag.match(/\s(?:data-original|data-src|src)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
      const srcset = tag.match(/\s(?:data-srcset|srcset)\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
      const raw = attr ? (attr[1] || attr[2] || attr[3] || "") : (srcset ? (srcset[1] || srcset[2] || "").split(/\s*,\s*/).pop()?.replace(/\s+\d+(?:\.\d+)?x?$/, "") : "");
      if (raw) imageCandidates.push(normImg(decodeEntities(raw)));
    }
    for (const candidate of imageCandidates) {
      try {
        const u = new URL(candidate);
        if (!/^https?:$/.test(u.protocol) || BAD_IMG.test(u.href)) continue;
        const host = u.hostname.replace(/^www\./i, "");
        const pathLooksLikeImage = /\.(?:jpe?g|png|webp|avif)(?:$|[?#])/i.test(u.href) ||
          /image|images|product|goods|upload|cdn|media|photo|picture/i.test(u.hostname + u.pathname);
        if (host !== baseHost || pathLooksLikeImage) { trustedMetaImage = candidate; break; }
      } catch { /* ignore invalid image URL */ }
    }
  }
  const trustedImage = ogTrusted || siteImg || (ldImage && !BAD_IMG.test(ldImage) ? ldImage : "") || trustedMetaImage;
  const image = trustedImage || ogImage;

  const rawPrice = firstVal(
    offer.price, offer.lowPrice, offer.priceSpecification?.price,
    meta("product:price:amount"), meta("og:price:amount")
  );
  const rawOldPrice = firstVal(
    meta("product:price:old_amount"), meta("og:price:old_amount"),
    meta("product:original_price:amount"), meta("product:price:regular_amount")
  );
  const currency = String(
    firstVal(offer.priceCurrency, offer.priceSpecification?.priceCurrency,
      meta("product:price:currency"), meta("og:price:currency")) || ""
  ).trim().toUpperCase();
  /* الأسعار في البوت بالريال — نتجاهل السعر المقروء إذا كانت عملته غير SAR */
  const price = currency && currency !== "SAR" ? null : cleanNumber(String(rawPrice ?? ""));

  const oldPrice = currency && currency !== "SAR" ? null : cleanNumber(String(rawOldPrice ?? ""));
  return { title, image, price, oldPrice, trusted: Boolean(trustedImage) };
}

/* =========================
   Stats / History / Alerts
========================= */

/* =========================
   قاعدة البيانات D1 (الربط DB)
   إن وُجدت تُحفظ فيها النقرات والزيارات وسجل الأسعار والتنبيهات والآراء،
   وإلا تبقى في KV كما في الإصدارات السابقة.
========================= */

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS clicks (day TEXT NOT NULL, product_id TEXT NOT NULL, store TEXT NOT NULL DEFAULT '', n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, product_id))",
  "CREATE TABLE IF NOT EXISTS visit_days (day TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS visit_sessions (day TEXT NOT NULL, session_id TEXT NOT NULL, PRIMARY KEY (day, session_id))",
  "CREATE TABLE IF NOT EXISTS price_history (product_id TEXT NOT NULL, t INTEGER NOT NULL, price REAL NOT NULL, PRIMARY KEY (product_id, t))",
  "CREATE TABLE IF NOT EXISTS alerts (product_id TEXT NOT NULL, user_id TEXT NOT NULL, target REAL NOT NULL, PRIMARY KEY (product_id, user_id))",
  "CREATE TABLE IF NOT EXISTS reviews (identity TEXT PRIMARY KEY, name TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT NOT NULL, t INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL, exp INTEGER NOT NULL DEFAULT 0)"
];

/* صفوف النقرات المنقولة من KV: day = 'legacy' للإجماليات القديمة،
   و product_id يبدأ بـ ~ لإجماليات المتاجر (~s:اسم) والأيام (~d) التي لا ترتبط بمنتج */
const LEGACY_DAY = "legacy";

let schemaReady = null;
async function db(env) {
  if (!env.DB) return null;
  if (!schemaReady) schemaReady = env.DB.batch(SCHEMA.map(q => env.DB.prepare(q))).catch(e => { schemaReady = null; throw e; });
  await schemaReady;
  return env.DB;
}

const dayStr = (ago = 0) => new Date(Date.now() - ago * 86400000).toISOString().slice(0, 10);

async function getStats(env) {
  const d1 = await db(env);
  if (!d1) {
    const raw = await env.STATE.get("stats");
    return raw ? JSON.parse(raw) : { c: {}, s: {}, d: {} };
  }
  const [c, s, d] = await d1.batch([
    d1.prepare("SELECT product_id k, SUM(n) n FROM clicks WHERE product_id NOT LIKE '~%' GROUP BY product_id"),
    d1.prepare("SELECT store k, SUM(n) n FROM clicks WHERE store != '' GROUP BY store"),
    d1.prepare("SELECT day k, SUM(n) n FROM clicks WHERE day >= ? AND day != ? GROUP BY day").bind(dayStr(30), LEGACY_DAY)
  ]);
  const obj = r => Object.fromEntries(r.results.map(x => [x.k, x.n]));
  return { c: obj(c), s: obj(s), d: obj(d) };
}

async function recordClick(env, p) {
  const st = p.store || "أخرى", day = dayStr();
  const d1 = await db(env);
  if (d1) {
    await d1.prepare("INSERT INTO clicks (day, product_id, store, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, product_id) DO UPDATE SET n = n + 1, store = excluded.store")
      .bind(day, String(p.id), st).run();
    return;
  }
  const s = await getStats(env);
  s.c[p.id] = (s.c[p.id] || 0) + 1;
  s.s[st] = (s.s[st] || 0) + 1;
  s.d[day] = (s.d[day] || 0) + 1;
  Object.keys(s.d).sort().slice(0, -30).forEach(k => delete s.d[k]);
  await env.STATE.put("stats", JSON.stringify(s));
}

/* زيارة واحدة لكل جلسة في اليوم — يرجع true إن احتُسبت */
async function recordVisit(env, sessionId) {
  const day = dayStr();
  const d1 = await db(env);
  if (d1) {
    const r = await d1.prepare("INSERT OR IGNORE INTO visit_sessions (day, session_id) VALUES (?, ?)").bind(day, sessionId).run();
    if (!r.meta.changes) return false;
    await d1.prepare("INSERT INTO visit_days (day, n) VALUES (?, 1) ON CONFLICT (day) DO UPDATE SET n = n + 1").bind(day).run();
    return true;
  }
  const key = `visit:${day}:${sessionId}`;
  if (await env.STATE.get(key)) return false;
  await env.STATE.put(key, "1", { expirationTtl: 172800 });
  const dayKey = `visits:day:${day}`;
  await env.STATE.put(dayKey, String(Number(await env.STATE.get(dayKey) || 0) + 1), { expirationTtl: 400 * 86400 });
  await env.STATE.put("visits:total", String(Number(await env.STATE.get("visits:total") || 0) + 1));
  return true;
}

/* إجمالي الزيارات وزيارات آخر عدد من الأيام (الأقدم أولًا) */
async function visitStats(env, days) {
  const dates = Array.from({ length: days }, (_, i) => dayStr(days - 1 - i));
  const d1 = await db(env);
  if (d1) {
    const [rows, total] = await d1.batch([
      d1.prepare("SELECT day, n FROM visit_days WHERE day >= ? AND day != ?").bind(dates[0], LEGACY_DAY),
      d1.prepare("SELECT COALESCE(SUM(n), 0) n FROM visit_days")
    ]);
    const byDay = Object.fromEntries(rows.results.map(x => [x.day, x.n]));
    return { total: total.results[0].n, days: dates.map(date => ({ date, visits: byDay[date] || 0 })) };
  }
  const out = [];
  for (const date of dates) out.push({ date, visits: Number(await env.STATE.get(`visits:day:${date}`) || 0) });
  return { total: Number(await env.STATE.get("visits:total") || 0), days: out };
}

async function getHistory(env, id) {
  const d1 = await db(env);
  if (!d1) return JSON.parse((await env.STATE.get(`ph:${id}`)) || "[]");
  const { results } = await d1.prepare("SELECT t, price p FROM price_history WHERE product_id = ? ORDER BY t DESC LIMIT 40").bind(String(id)).all();
  return results.reverse();
}

async function pushHistory(env, id, price) {
  const d1 = await db(env);
  if (d1) {
    const last = await d1.prepare("SELECT t, price p FROM price_history WHERE product_id = ? ORDER BY t DESC LIMIT 1").bind(String(id)).first();
    if (last && Number(last.p) === Number(price) && Date.now() - last.t < 86400000) return;
    await d1.batch([
      d1.prepare("INSERT OR REPLACE INTO price_history (product_id, t, price) VALUES (?, ?, ?)").bind(String(id), Date.now(), Number(price)),
      d1.prepare("DELETE FROM price_history WHERE product_id = ?1 AND t < (SELECT t FROM price_history WHERE product_id = ?1 ORDER BY t DESC LIMIT 1 OFFSET 39)").bind(String(id))
    ]);
    return;
  }
  const k = `ph:${id}`;
  const arr = JSON.parse((await env.STATE.get(k)) || "[]");
  const last = arr[arr.length - 1];
  if (last && Number(last.p) === Number(price) && Date.now() - last.t < 86400000) return;
  arr.push({ t: Date.now(), p: Number(price) });
  await env.STATE.put(k, JSON.stringify(arr.slice(-40)));
}

async function addAlert(env, id, userId, target) {
  const d1 = await db(env);
  if (d1) {
    await d1.prepare("INSERT OR REPLACE INTO alerts (product_id, user_id, target) VALUES (?, ?, ?)").bind(String(id), String(userId), Number(target)).run();
    return;
  }
  const k = `al:${id}`;
  const arr = JSON.parse((await env.STATE.get(k)) || "[]").filter(a => a.u !== String(userId));
  arr.push({ u: String(userId), t: Number(target) });
  await env.STATE.put(k, JSON.stringify(arr));
}

const goUrl = (env, p) => (baseUrl(env) ? `${baseUrl(env)}/go/${p.id}` : p.link);

async function checkAlerts(env, p, price) {
  const d1 = await db(env);
  if (d1) {
    const { results } = await d1.prepare("SELECT user_id u, target t FROM alerts WHERE product_id = ? AND target >= ?").bind(String(p.id), Number(price)).all();
    for (const a of results) {
      try {
        await sendMessage(a.u,
          `🔔 نزل السعر!\n\n${p.title}\n💰 الآن: ${price} ريال (هدفك ${a.t})`, env,
          { reply_markup: { inline_keyboard: [[{ text: "🛒 اشتر الآن", url: goUrl(env, p) }]] } });
        await d1.prepare("DELETE FROM alerts WHERE product_id = ? AND user_id = ?").bind(String(p.id), a.u).run();
      } catch (e) { console.error("alert send failed", e); }
    }
    return;
  }
  const k = `al:${p.id}`;
  const raw = await env.STATE.get(k);
  if (!raw) return;
  const keep = [];
  for (const a of JSON.parse(raw)) {
    if (Number(price) <= a.t) {
      try {
        await sendMessage(a.u,
          `🔔 نزل السعر!\n\n${p.title}\n💰 الآن: ${price} ريال (هدفك ${a.t})`, env,
          { reply_markup: { inline_keyboard: [[{ text: "🛒 اشتر الآن", url: goUrl(env, p) }]] } });
      } catch { keep.push(a); }
    } else keep.push(a);
  }
  if (keep.length) await env.STATE.put(k, JSON.stringify(keep));
  else await env.STATE.delete(k);
}

/* فحص أسعار دوري (كرون) — يرسل للمدير اقتراح تحديث ولا يعدّل تلقائيًا */
async function checkPrices(env) {
  const { data } = await readProducts(env);
  const list = allProducts(data).filter(x => !x.product.expired && x.product.link);
  if (!list.length) return { checked: 0, changed: 0 };
  const BATCH = 12;
  const cur = Number(await env.STATE.get("pc:cursor")) || 0;
  await env.STATE.put("pc:cursor", String((cur + BATCH) % list.length));
  const admin = String(env.ADMIN_ID || "").split(",")[0].trim();
  let checked = 0, changed = 0;

  for (let i = 0; i < Math.min(BATCH, list.length); i++) {
    const { product: p } = list[(cur + i) % list.length];
    try {
      const op = Number(p.price);
      if (!(op > 0)) continue;
      const { html, status } = await fetchPage(p.link);
      if (status >= 400) continue;
      const m = extractMeta(html, p.link);
      const np = Number(m.price);
      if (!(np > 0) || np / op < 0.3 || np / op > 3) continue;
      checked++;
      await pushHistory(env, p.id, np);
      await checkAlerts(env, p, np);
      if (admin && Math.abs(np - op) / op >= 0.02) {
        changed++;
        await sendMessage(admin,
          `💱 تغيّر السعر\n\n${p.title}\n🏬 ${p.store || "؟"}\nالمسجّل: ${op} → الجديد: ${np} ريال`, env,
          { reply_markup: { inline_keyboard: [[
            { text: "✅ حدّث السعر", callback_data: `up:${p.id}:${np}` },
            { text: "📦 المنتج", callback_data: `p:${p.id}` }
          ]] } });
      }
    } catch (e) { console.error("price check", p.id, e); }
  }
  return { checked, changed };
}

/* =========================
   آراء العملاء عن المتجر
========================= */

async function getReviews(env) {
  const d1 = await db(env);
  if (d1) {
    const { results } = await d1.prepare("SELECT identity u, name n, rating r, comment c, t FROM reviews ORDER BY t DESC LIMIT 200").all();
    return results.reverse();
  }
  const raw = await env.STATE.get("reviews");
  return raw ? JSON.parse(raw) : [];
}

/* رأي واحد لكل شخص: يستبدل رأيه السابق (oldId هو معرّف تلجرام بالصيغة القديمة قبل tg:) */
async function saveReview(env, review, oldId = "") {
  const d1 = await db(env);
  if (d1) {
    await d1.batch([
      d1.prepare("DELETE FROM reviews WHERE identity = ?").bind(oldId || review.u),
      d1.prepare("INSERT OR REPLACE INTO reviews (identity, name, rating, comment, t) VALUES (?, ?, ?, ?, ?)").bind(review.u, review.n, review.r, review.c, review.t)
    ]);
    return;
  }
  const list = (await getReviews(env)).filter(x => x.u !== review.u && x.u !== oldId);
  list.push(review);
  await env.STATE.put("reviews", JSON.stringify(list.slice(-200)));
}

async function deleteReview(env, t) {
  const d1 = await db(env);
  if (d1) return d1.prepare("DELETE FROM reviews WHERE t = ?").bind(Number(t)).run();
  const list = (await getReviews(env)).filter(x => String(x.t) !== String(t));
  await env.STATE.put("reviews", JSON.stringify(list));
}

/* =========================
   صيانة D1 ونقل البيانات القديمة من KV
========================= */

async function cleanupDb(env) {
  const d1 = await db(env);
  if (!d1) return;
  await d1.batch([
    d1.prepare("DELETE FROM visit_sessions WHERE day < ?").bind(dayStr(2)),
    d1.prepare("DELETE FROM meta WHERE exp > 0 AND exp < ?").bind(Date.now())
  ]);
}

async function kvListAll(env, prefix) {
  const keys = [];
  let cursor;
  do {
    const page = await env.STATE.list({ prefix, cursor });
    keys.push(...page.keys.map(k => k.name));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return keys;
}

/* نقل لمرة واحدة: يقرأ KV ولا يحذف منه شيئًا. كل جدول يُنقل باستعلام واحد عبر json_each */
async function migrateKvToD1(env) {
  const d1 = await db(env);
  if (!d1) return "⚠️ قاعدة البيانات غير مربوطة بعد.\nأضف الربط DB في إعدادات الـWorker ثم أعد المحاولة.";
  const done = await d1.prepare("SELECT v FROM meta WHERE k = 'migrated'").first();
  if (done) return `✅ البيانات القديمة نُقلت من قبل (${done.v}).`;

  const raw = await env.STATE.get("stats");
  const s = raw ? JSON.parse(raw) : { c: {}, s: {}, d: {} };
  const clicks = [
    ...Object.entries(s.c || {}).map(([id, n]) => [LEGACY_DAY, String(id), "", n]),
    ...Object.entries(s.s || {}).map(([st, n]) => [LEGACY_DAY, `~s:${st}`, st, n]),
    ...Object.entries(s.d || {}).map(([day, n]) => [day, "~d", "", n])
  ];

  const visitDays = [];
  for (const k of await kvListAll(env, "visits:day:"))
    visitDays.push([k.slice("visits:day:".length), Number(await env.STATE.get(k) || 0)]);
  const legacyVisits = Number(await env.STATE.get("visits:total") || 0) - visitDays.reduce((n, [, v]) => n + v, 0);
  if (legacyVisits > 0) visitDays.push([LEGACY_DAY, legacyVisits]);

  const history = [];
  for (const k of await kvListAll(env, "ph:"))
    for (const x of JSON.parse(await env.STATE.get(k) || "[]")) history.push([k.slice(3), x.t, x.p]);

  const alerts = [];
  for (const k of await kvListAll(env, "al:"))
    for (const a of JSON.parse(await env.STATE.get(k) || "[]")) alerts.push([k.slice(3), String(a.u), a.t]);

  const reviewsRaw = await env.STATE.get("reviews");
  const reviews = (reviewsRaw ? JSON.parse(reviewsRaw) : []).map(x => [String(x.u), x.n, x.r, x.c || "", x.t]);

  const each = cols => cols.map((_, i) => `json_extract(value, '$[${i}]')`).join(", ");
  await d1.batch([
    d1.prepare(`INSERT OR IGNORE INTO clicks (day, product_id, store, n) SELECT ${each([1, 2, 3, 4])} FROM json_each(?)`).bind(JSON.stringify(clicks)),
    d1.prepare(`INSERT INTO visit_days (day, n) SELECT ${each([1, 2])} FROM json_each(?) WHERE true ON CONFLICT (day) DO UPDATE SET n = n + excluded.n`).bind(JSON.stringify(visitDays)),
    d1.prepare(`INSERT OR IGNORE INTO price_history (product_id, t, price) SELECT ${each([1, 2, 3])} FROM json_each(?)`).bind(JSON.stringify(history)),
    d1.prepare(`INSERT OR IGNORE INTO alerts (product_id, user_id, target) SELECT ${each([1, 2, 3])} FROM json_each(?)`).bind(JSON.stringify(alerts)),
    d1.prepare(`INSERT OR IGNORE INTO reviews (identity, name, rating, comment, t) SELECT ${each([1, 2, 3, 4, 5])} FROM json_each(?)`).bind(JSON.stringify(reviews)),
    d1.prepare("INSERT INTO meta (k, v) VALUES ('migrated', ?)").bind(new Date().toISOString().slice(0, 16).replace("T", " "))
  ]);
  return `✅ تم نقل البيانات القديمة إلى قاعدة البيانات\n\n` +
    `🛒 سجلات النقرات: ${clicks.length}\n👥 أيام الزيارات: ${visitDays.length}\n` +
    `📈 نقاط سجل الأسعار: ${history.length}\n🔔 تنبيهات الأسعار: ${alerts.length}\n💬 الآراء: ${reviews.length}\n\n` +
    `البيانات القديمة باقية في KV كنسخة احتياطية.`;
}

const reviewsSummary = list => ({
  count: list.length,
  avg: list.length ? Math.round(list.reduce((n, x) => n + x.r, 0) / list.length * 10) / 10 : 0
});

const stars = n => "⭐".repeat(n);

async function notifyAdminReview(env, name, rating, comment) {
  const admin = String(env.ADMIN_ID || "").split(",")[0].trim();
  if (!admin) return;
  await sendMessage(admin,
    `💬 رأي جديد عن المتجر\n\n${name} — ${stars(rating)}\n${comment || "(بدون تعليق)"}`, env,
    { reply_markup: { inline_keyboard: [[{ text: "💬 كل الآراء", callback_data: "reviews" }]] } });
}

async function showReviews(ref, env) {
  const list = await getReviews(env);
  const { count, avg } = reviewsSummary(list);
  const back = [{ text: "🔙 القائمة", callback_data: "back_menu" }];
  if (!count) return ui(ref, "💬 آراء العملاء\n\nلا توجد آراء بعد.", [back], env);
  const latest = list.slice(-8).reverse();
  const text =
    `💬 آراء العملاء عن وَفِّرْهَا صَحّ\n\n⭐ المعدل: ${avg}/5 • ${count} رأي\n\n` +
    latest.map((x, i) => `${i + 1}. ${x.n} — ${stars(x.r)}\n${x.c || "(بدون تعليق)"}`).join("\n\n");
  const rows = latest.map((x, i) => [{ text: `🗑️ حذف رأي ${i + 1} (${x.n})`, callback_data: `rvd:${x.t}` }]);
  rows.push(back);
  await ui(ref, text, rows, env);
}

/* =========================
   Telegram initData verification
========================= */

async function verifyInitData(initData, env) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");
    const dcs = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
    const enc = new TextEncoder();
    const hmac = async (key, msg) => new Uint8Array(await crypto.subtle.sign(
      "HMAC", await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
      enc.encode(msg)));
    const secret = await hmac(enc.encode("WebAppData"), env.BOT_TOKEN);
    const sig = await hmac(secret, dcs);
    const hex = [...sig].map(b => b.toString(16).padStart(2, "0")).join("");
    if (hex !== hash) return null;
    if (Date.now() / 1000 - Number(params.get("auth_date") || 0) > 86400) return null;
    return JSON.parse(params.get("user") || "null");
  } catch { return null; }
}

/* =========================
   Admin / Router
========================= */

function isAdmin(userId, env) {
  return String(env.ADMIN_ID || "").split(",").map(s => s.trim()).filter(Boolean).includes(String(userId));
}

async function handleUpdate(update, env) {
  const message = update.message;
  const callback = update.callback_query;
  const chatId = message?.chat?.id ?? callback?.message?.chat?.id ?? callback?.from?.id;

  try {
    /* رسائل غير المدير لا تُكتب في KV حتى لا تستهلك حد الكتابة اليومي */
    if (callback && !isAdmin(callback.from.id, env)) return answerCallback(callback.id, env, "غير مصرح ❌");
    if (!callback && (!message?.from || !isAdmin(message.from.id, env))) return;
    if (await isDuplicateUpdate(update, env)) return;

    if (callback) {
      await answerCallback(callback.id, env);
      return handleCallback(callback, env);
    }

    const userId = String(message.from.id);
    const text = message.text?.trim();

    if (text === "/start" || text === "/menu") { await clearState(userId, env); return showMenu({ chatId }, env); }
    if (text === "/add") return startAdd({ chatId }, userId, env);
    if (text === "/stats") return showStats({ chatId }, env);
    if (text === "/migrate") return sendMessage(chatId, await migrateKvToD1(env), env);
    if (text === "/cancel") {
      await clearState(userId, env);
      await sendMessage(chatId, "تم إلغاء العملية ❌", env);
      return showMenu({ chatId }, env);
    }

    await processMessage(message, env);
  } catch (error) {
    console.error(error);
    if (chatId) {
      try { await sendMessage(chatId, "❌ حدث خطأ غير متوقع.\nأرسل /menu وحاول مرة أخرى.", env); }
      catch (e) { console.error(e); }
    }
  }
}

/* =========================
   Menus & Lists
========================= */

async function showMenu(ref, env) {
  await ui(ref, "🔥 وَفِّرْهَا صَحّ 🔥\n\nلوحة إدارة المنتجات\n\nاختر العملية:", [
    [{ text: "➕ إضافة منتج (برابط)", callback_data: "add_product" }],
    [{ text: "📦 المنتجات", callback_data: "list_products" }, { text: "🏬 حسب المتجر", callback_data: "stores" }],
    [{ text: "🔥 عروض اليوم", callback_data: "deals:0" }, { text: "⭐ المميزة", callback_data: "featured:0" }],
    [{ text: "🔎 بحث", callback_data: "search_product" }, { text: "📊 الإحصائيات", callback_data: "stats" }],
    [{ text: "💬 آراء العملاء", callback_data: "reviews" }, { text: "🔄 فحص الأسعار", callback_data: "checkprices" }]
  ], env);
}

async function listCategories(ref, env) {
  const products = await getProducts(env);
  let total = 0, active = 0;
  const rows = CATEGORY_ORDER.map(([key, name]) => {
    const items = products[key];
    total += items.length;
    active += items.filter(p => !p.expired).length;
    return [{ text: `${name} (${items.length})`, callback_data: `c:${key}:0` }];
  });
  const grid = pairRows(rows);
  grid.push([{ text: "🏬 حسب المتجر", callback_data: "stores" }, { text: "🔎 بحث", callback_data: "search_product" }]);
  grid.push([{ text: "🔙 القائمة", callback_data: "back_menu" }]);
  await ui(ref, `📦 المنتجات\n\n📊 الإجمالي: ${total} • النشطة: ${active}\n\nاختر القسم:`, grid, env);
}

/* قائمة مقسّمة لصفحات (للأقسام، العروض، المميزة، المتاجر) */
async function pagedList(ref, { title, entries, page, cb, back, icon = "" }, env) {
  if (!entries.length)
    return ui(ref, `${title}\n\nلا توجد منتجات.`, [[{ text: "🔙 رجوع", callback_data: back }]], env);
  const pages = Math.ceil(entries.length / PAGE_SIZE);
  page = clamp(page, 0, pages - 1);
  const slice = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const rows = slice.map(({ product: p }) => [{
    text: `${icon}${p.featured ? "⭐ " : ""}${p.expired ? "⛔ " : ""}${String(p.title || "منتج").slice(0, 38)} • ${p.price}`,
    callback_data: `p:${p.id}`
  }]);
  const nav = [];
  if (page > 0) nav.push({ text: "◀️ السابق", callback_data: cb(page - 1) });
  if (page < pages - 1) nav.push({ text: "التالي ▶️", callback_data: cb(page + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: "🔙 رجوع", callback_data: back }]);
  await ui(ref, `${title}\n📄 ${page + 1}/${pages} • ${entries.length} منتج\n\nاختر المنتج:`, rows, env);
}

async function listCategoryPage(ref, category, page, env) {
  if (!CATEGORIES[category]) return ui(ref, "❌ القسم غير موجود.", null, env);
  const entries = [...(await getProducts(env))[category]].reverse().map(product => ({ product }));
  return pagedList(ref, {
    title: `📦 ${CATEGORIES[category]}`, entries, page,
    cb: n => `c:${category}:${n}`, back: "list_products"
  }, env);
}

async function listStores(ref, env) {
  const products = await getProducts(env);
  const all = allProducts(products);
  const rows = STORES.map(([name]) => [{
    text: `🏬 ${name} (${all.filter(x => x.product.store === name).length})`,
    callback_data: `st:${name}:0`
  }]);
  const other = all.filter(x => !x.product.store).length;
  if (other) rows.push([{ text: `❔ بدون متجر (${other})`, callback_data: "st:none:0" }]);
  rows.push([{ text: "🔙 القائمة", callback_data: "back_menu" }]);
  await ui(ref, "🏬 المنتجات حسب المتجر\n\nكل منتج يُصنَّف تلقائيًا حسب رابطه:", pairRows(rows.slice(0, -1)).concat([rows[rows.length - 1]]), env);
}

async function listByStore(ref, store, page, env) {
  const all = allProducts(await getProducts(env));
  const entries = all.filter(x => store === "none" ? !x.product.store : x.product.store === store).reverse();
  return pagedList(ref, {
    title: `🏬 ${store === "none" ? "بدون متجر" : store}`, entries, page,
    cb: n => `st:${store}:${n}`, back: "stores"
  }, env);
}

async function showDeals(ref, page, env) {
  const deals = getTopDeals(await getProducts(env)).slice(0, 100);
  return pagedList(ref, {
    title: "🔥 عروض اليوم\nالترتيب: الخصم + التمييز + الحداثة", entries: deals, page,
    cb: n => `deals:${n}`, back: "back_menu", icon: "🔥 "
  }, env);
}

async function showFeatured(ref, page, env) {
  return pagedList(ref, {
    title: "⭐ المنتجات المميزة", entries: getFeaturedProducts(await getProducts(env)), page,
    cb: n => `featured:${n}`, back: "back_menu"
  }, env);
}

async function showStats(ref, env) {
  const s = await getStats(env);
  const products = await getProducts(env);
  const title = id => String(findProduct(products, id)?.product.title || id).slice(0, 40);
  const top = Object.entries(s.c).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const stores = Object.entries(s.s).sort((a, b) => b[1] - a[1]);
  const days = Object.entries(s.d).sort().slice(-7);
  const total7 = days.reduce((n, [, v]) => n + v, 0);
  const all = allProducts(products);
  const { total: visitTotal, days: visitDays } = await visitStats(env, 7);
  const d1 = await db(env);
  const storage = !d1 ? "🗄️ التخزين: KV (حد 1000 كتابة يوميًا) — اربط D1 لرفع الحد"
    : (await d1.prepare("SELECT 1 FROM meta WHERE k = 'migrated'").first()) ? "🗄️ التخزين: قاعدة البيانات D1 ✅"
    : "🗄️ التخزين: D1 — أرسل /migrate لنقل البيانات القديمة";
  const visit7 = visitDays.reduce((n, x) => n + x.visits, 0);
  const text =
    `📊 الإحصائيات\n\n` +
    `👥 زيارات المتجر اليوم: ${visitDays[6].visits}\n` +
    `📅 زيارات آخر 7 أيام: ${visit7}\n` +
    `🌐 إجمالي الزيارات المسجلة: ${visitTotal}\n` +
    `🛒 نقرات روابط المنتجات آخر 7 أيام: ${total7}\n\n` +
    `📦 المنتجات: ${all.length} • النشطة: ${all.filter(x => !x.product.expired).length}\n\n` +
    (top.length ? `🏆 الأكثر نقرًا:\n${top.map(([id, n], i) => `${i + 1}. ${title(id)} — ${n}`).join("\n")}\n\n` : "لا توجد نقرات مسجلة بعد.\n\n") +
    (stores.length ? `🏬 النقرات حسب المتجر:\n${stores.map(([k, n]) => `• ${k}: ${n}`).join("\n")}\n\n` : "") +
    storage;
  await ui(ref, text, [[{ text: "🔙 القائمة", callback_data: "back_menu" }]], env);
}

/* =========================
   Product management
========================= */

async function showProduct(ref, id, env) {
  const products = await getProducts(env);
  const located = findProduct(products, id);
  if (!located)
    return ui(ref, "❌ المنتج غير موجود.", [[{ text: "🔙 المنتجات", callback_data: "list_products" }]], env);

  const { category, product: p } = located;
  const offers = groupOf(products, p);
  const rows = [
    [{ text: "✏️ تعديل", callback_data: `e:${id}` }],
    [
      { text: p.featured ? "⭐ إلغاء التمييز" : "⭐ تمييز", callback_data: `tg:featured:${id}` },
      { text: p.expired ? "✅ إعادة تفعيل" : "⛔ منتهي العرض", callback_data: `tg:expired:${id}` }
    ],
    [p.groupId
      ? { text: "✂️ فك الربط", callback_data: `ul:${id}` }
      : { text: "🔗 ربط بمنتج مماثل", callback_data: `lk:${id}` }],
    [{ text: "🛒 فتح الرابط", url: p.link }]
  ];
  if (env.CHANNEL_ID) rows.push([{ text: "📣 انشر في القناة", callback_data: `ch:${id}` }]);
  rows.push([{
    text: "𝕏 تجهيز منشور لـ X (مجاني)",
    callback_data: `x:${id}`
  }]);
  rows.push([{ text: "🗑️ حذف", callback_data: `d:${id}` }]);
  rows.push([{ text: "🔙 المنتجات", callback_data: `c:${category}:0` }]);
  await ui(ref, `📦 إدارة المنتج\n\n${productCard(p, offers)}`, rows, env);
}

async function showEditMenu(ref, id, env) {
  const located = findProduct(await getProducts(env), id);
  if (!located) return ui(ref, "❌ المنتج غير موجود.", null, env);
  await ui(ref, `✏️ تعديل المنتج\n\n${located.product.title}\n\nاختر ما تريد تعديله:`, [
    [{ text: "📝 اسم المنتج", callback_data: `ef:title:${id}` }],
    [{ text: "💰 السعر الحالي", callback_data: `ef:price:${id}` }],
    [{ text: "🏷️ السعر السابق", callback_data: `ef:old:${id}` }],
    [{ text: "🔗 رابط الشراء", callback_data: `ef:link:${id}` }],
    [{ text: "📂 تغيير القسم", callback_data: `ef:category:${id}` }],
    [{ text: "🖼️ تغيير الصورة", callback_data: `ef:image:${id}` }],
    [{ text: "🔙 رجوع", callback_data: `p:${id}` }]
  ], env);
}

const editDoneButtons = id => [
  [{ text: "✏️ متابعة التعديل", callback_data: `e:${id}` }],
  [{ text: "📦 عرض المنتج", callback_data: `p:${id}` }]
];

function categoryButtons(prefix, id = "") {
  return pairRows(CATEGORY_ORDER.map(([key, name]) => [{
    text: name, callback_data: prefix === "cat" ? `cat:${key}` : `nc:${key}:${id}`
  }]));
}

const EDIT_FIELDS = {
  title: { parse: t => t?.trim() || null, error: "❌ أرسل اسمًا صحيحًا.", label: "اسم المنتج", prompt: "📝 أرسل الاسم الجديد:" },
  price: { parse: cleanNumber, error: "❌ أرسل سعرًا صحيحًا، مثال: 69 أو 69.50", label: "السعر الحالي", prompt: "💰 أرسل السعر الجديد (يقبل الأرقام العربية):" },
  old: {
    parse: t => (/^[-–]$/.test((t || "").trim()) ? REMOVE : cleanNumber(t)),
    error: "❌ أرسل سعرًا صحيحًا، مثال: 103 — أو - لحذف السعر السابق",
    label: "السعر السابق", prompt: "🏷️ أرسل السعر السابق الجديد، أو أرسل - لحذفه:"
  },
  link: { parse: t => (isValidUrl(t?.trim()) ? t.trim() : null), error: "❌ الرابط غير صحيح. أرسل رابطًا يبدأ بـ https://", label: "رابط الشراء", prompt: "🔗 أرسل رابط الشراء الجديد:" }
};

/* =========================
   Messages router
========================= */

async function processMessage(message, env) {
  const userId = String(message.from.id);
  const ref = { chatId: message.chat.id };
  const state = await getState(userId, env);
  if (!state) return showMenu(ref, env);

  if (state.step === "search_product") return processSearch(message, userId, ref, env);
  if (state.step === "editing") return processEdit(message, state, userId, ref, env);
  if (ADD_STEPS.has(state.step)) return processAdd(message, state, userId, ref, env);
  return showMenu(ref, env);
}

async function processEdit(message, state, userId, ref, env) {
  const chatId = ref.chatId;

  /* نص */
  if (EDIT_FIELDS[state.field]) {
    const cfg = EDIT_FIELDS[state.field];
    const value = cfg.parse(message.text);
    if (!value) return sendMessage(chatId, cfg.error, env);
    try {
      const result = await updateProducts(env, products => {
        const located = findProduct(products, state.id);
        if (!located) throw new Error("NOT_FOUND");
        const p = located.product;
        const oldTitle = p.title;
        if (value === REMOVE) delete p[state.field];
        else p[state.field] = value;
        /* عند تحويل الاسم من غير عربي إلى عربي نحتفظ بالأصلي */
        if (state.field === "title" && oldTitle && !/[\u0600-\u06FF]/.test(oldTitle) && /[\u0600-\u06FF]/.test(value))
          p.originalTitle = oldTitle;
        if (state.field === "link") p.store = detectStore(value) || p.store || "";
        if (Number(p.old) && Number(p.price) >= Number(p.old)) throw new Error("PRICE_ORDER");
        p.discount = calcDiscount(p.price, p.old);
        return located;
      }, `Edit ${state.field}: ${state.id}`);

      await clearState(userId, env);
      if (state.field === "price") {
        await pushHistory(env, result.product.id, result.product.price).catch(console.error);
        await checkAlerts(env, result.product, Number(result.product.price)).catch(console.error);
      }
      await sendMessage(chatId, `✅ تم تعديل ${cfg.label} بنجاح.`, env,
        { reply_markup: { inline_keyboard: [
          ...(state.field === "title" && env.CHANNEL_ID ? [[{ text: "📣 انشر بالاسم الجديد في القناة", callback_data: `ch:${result.product.id}` }]] : []),
          ...editDoneButtons(result.product.id)
        ] } });
    } catch (e) {
      if (e.message === "NOT_FOUND") { await clearState(userId, env); return sendMessage(chatId, "❌ المنتج غير موجود.", env); }
      if (e.message === "PRICE_ORDER")
        return sendMessage(chatId, "❌ السعر الحالي يجب أن يكون أقل من السعر السابق.\nأعد الإرسال، أو عدّل/احذف السعر السابق أولًا (بإرسال - ). /cancel للإلغاء.", env);
      throw e;
    }
    return;
  }

  /* صورة */
  if (state.field === "image") {
    const fileId = extractImageFileId(message);
    if (!fileId) return sendMessage(chatId, "❌ أرسل صورة فقط.", env);
    await sendMessage(chatId, "⏳ جاري رفع الصورة الجديدة...", env);
    let newPath;
    try {
      const { bytes, ext } = await downloadTelegramImage(fileId, env);
      newPath = `products/product-${Date.now()}-${shortId()}.${ext}`;
      await githubUploadBinary(newPath, bytes, "Update product image", env);
      let oldPath;
      await updateProducts(env, products => {
        const located = findProduct(products, state.id);
        if (!located) throw new Error("NOT_FOUND");
        oldPath = located.product.image;
        located.product.image = newPath;
      }, `Edit image: ${state.id}`);
      await githubDeleteFile(oldPath, env);
      await clearState(userId, env);
      await sendMessage(chatId, "✅ تم تغيير صورة المنتج بنجاح.", env,
        { reply_markup: { inline_keyboard: editDoneButtons(state.id) } });
    } catch (e) {
      console.error(e);
      if (newPath) await githubDeleteFile(newPath, env);
      await sendMessage(chatId, "❌ فشل تغيير الصورة. لم يتم تعديل المنتج.", env);
    }
  }
}

/* =========================
   Add flow (رابط أولًا + تعبئة تلقائية)
========================= */

async function startAdd(ref, userId, env) {
  await saveState(userId, { step: "link", product: {} }, env);
  await sendMessage(ref.chatId,
    "➕ إضافة منتج جديد\n\n" +
    "🔗 أرسل رابط المنتج، وسأحمّل صورته بجودتها الأصلية من المتجر وأحدد المتجر تلقائيًا.\n" +
    "سأحاول تعبئة الاسم والسعر والسعر السابق والصورة تلقائيًا من الرابط، ثم أسألك فقط عن البيانات الناقصة والقسم.\n\nللإلغاء: /cancel", env);
}

/* يحدد الخطوة التالية حسب الناقص */
async function advance(ref, userId, state, env) {
  const d = state.product;
  const ask = async (step, text, markup) => {
    state.step = step;
    await saveState(userId, state, env);
    return sendMessage(ref.chatId, text, env, markup ? { reply_markup: { inline_keyboard: markup } } : {});
  };

  if (!d.link) return ask("link", "🔗 أرسل رابط المنتج.");
  if (!d.telegram_file_id && !d.has_img)
    return ask("image", "📸 تعذر تحميل الصورة تلقائيًا. أرسل صورة المنتج — الأفضل كـ «ملف» (📎 ← ملف) للحفاظ على الدقة.");
  if (!d.title) return ask("title", "📝 أرسل اسم المنتج.");
  if (!d.price) return ask("price", "💰 أرسل السعر الحالي بالريال. مثال: 69");
  if (d.old === undefined) return ask("old", "🏷️ أرسل السعر قبل الخصم، أو أرسل - إذا لا يوجد خصم.");

  if (!d.category) {
    const s = guessCategory(`${d.title} ${d.originalTitle || ""}`);
    const rows = categoryButtons("cat");
    if (s) rows.unshift([{ text: `✅ المقترح: ${CATEGORIES[s]}`, callback_data: `cat:${s}` }]);
    return ask("category", "📂 اختر القسم:", rows);
  }

  if (d.group === undefined) {
    const found = similarTo(await getProducts(env), d.title, d.store, "", 0.4, 4, d.originalTitle || "");
    if (!found.length) d.group = "";
    else {
      const rows = found.map(({ product: p }) => [{
        text: `🔗 ${p.store || "؟"} • ${String(p.title).slice(0, 30)} (${p.price})`, callback_data: `gl:${p.id}`
      }]);
      rows.push([{ text: "➡️ منتج مستقل", callback_data: "gl:0" }]);
      return ask("group", "🔁 وجدت منتجات مشابهة في متاجر أخرى.\nهل هذا نفس المنتج؟ (لتفعيل مقارنة الأسعار)", rows);
    }
  }

  return sendPreview(ref, userId, state, env);
}

/* =========================
   ترجمة اسم المنتج إلى العربية
   سلسلة بدائل: Workers AI (إن وُجد الربط AI) ← Google ← MyMemory
========================= */

const hasArabic = s => /[\u0600-\u06FF]/.test(String(s || ""));

function tidyArabicTitle(text) {
  let t = String(text || "").replace(/\s+/g, " ").replace(/^["'«»“”\s]+|["'«»“”\s]+$/g, "").trim();
  t = t.replace(/[.،]+$/, "").trim();
  if (t.length > 120) { t = t.slice(0, 120); const i = t.lastIndexOf(" "); if (i > 60) t = t.slice(0, i); }
  return t;
}

async function translateWithWorkersAI(env, text) {
  if (!env?.AI) return "";
  const res = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content:
        "You translate e-commerce product titles into concise, natural Arabic for a Saudi deals channel. " +
        "Keep brand names, model numbers and units (ml, g, GB, W) in Latin characters. " +
        "Remove repeated marketing phrases. Maximum 15 words. Output ONLY the Arabic title, nothing else." },
      { role: "user", content: text }
    ],
    max_tokens: 120
  });
  return tidyArabicTitle(res?.response || "");
}

async function translateWithGoogle(text) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=" + encodeURIComponent(text);
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("google " + r.status);
  const j = await r.json();
  return tidyArabicTitle((Array.isArray(j?.[0]) ? j[0] : []).map(x => x?.[0] || "").join(""));
}

async function translateWithMyMemory(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${encodeURIComponent("Autodetect|ar")}`;
  const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("mymemory " + r.status);
  const data = await r.json();
  const out = decodeEntities(String(data?.responseData?.translatedText || ""));
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|PLEASE SELECT|NO QUERY SPECIFIED|INVALID/i.test(out)) throw new Error("mymemory limit");
  return tidyArabicTitle(out);
}

/* يرجع الاسم العربي، وإن فشلت كل الطرق يرجع الاسم الأصلي كما هو (لتعدّله أنت) */
async function translateProductTitle(title, env = {}) {
  const original = String(title || "").replace(/\s+/g, " ").trim();
  if (original.length < 3 || hasArabic(original)) return original;
  const src = original.slice(0, 200);
  const attempts = [
    ["workers-ai", () => translateWithWorkersAI(env, src)],
    ["google", () => translateWithGoogle(src)],
    ["mymemory", () => translateWithMyMemory(src)]
  ];
  for (const [name, run] of attempts) {
    try {
      const out = await run();
      if (out && hasArabic(out)) return out;
    } catch (e) {
      console.error("translate", name, String(e?.message || e).slice(0, 120));
    }
  }
  return original;
}

async function intakeLink(ref, userId, state, link, env) {
  const d = state.product;
  if (!isValidUrl(link)) return sendMessage(ref.chatId, "❌ الرابط غير صحيح.", env);

  const products = await getProducts(env);
  const dup = allProducts(products).find(x => x.product.link === link);
  if (dup) return sendMessage(ref.chatId, `⚠️ هذا الرابط مضاف مسبقًا:\n${dup.product.title}\n\nأرسل رابطًا آخر أو /cancel`, env);

  d.link = link;
  d.store = detectStore(link);
  await sendMessage(ref.chatId, "🖼️ جاري قراءة بيانات المنتج وتحميل صورته...", env);

  let m = null;
  let finalUrl = link;
  const imageCandidates = [];
  const addImage = value => {
    if (!value) return;
    const v = String(value).trim();
    if (/^https?:\/\//i.test(v) && !imageCandidates.includes(v)) imageCandidates.push(v);
  };

  /* 1) قراءة مباشرة: بعض المتاجر تعرض بيانات مختلفة لزواحف المعاينة */
  try {
    const page = await fetchPage(link, "social");
    finalUrl = page.finalUrl || link;
    if (!d.store) d.store = detectStore(finalUrl);
    if (page.status < 400 && page.html.length > 100) {
      m = extractMeta(page.html, finalUrl);
      if (!d.title && m.title) d.title = m.title;
      if (!d.price && m.price) d.price = m.price;
      if (d.old === undefined && m.oldPrice && d.price && Number(m.oldPrice) > Number(d.price)) d.old = m.oldPrice;
      addImage(m.image);
      const raw = page.html.replace(/\\u002F/gi, "/").replace(/\\\//g, "/");
      /* صور Temu قد تأتي من مضيف CDN مختلف أو بصيغة URL مشفّرة داخل JSON */
      let finalHost = "";
      try { finalHost = new URL(finalUrl).hostname; } catch { /* ignore */ }
      if (/temu/i.test(finalHost)) {
        const re = /https?:\\?\/\\?\/[\w.-]*kwcdn\.com\\?\/[\w%/.\-?=&]+?\.(?:jpe?g|png|webp)(?:\?[\w%&=.\-]*)?/gi;
        for (const hit of raw.match(re) || []) addImage(hit.replace(/\\\//g, "/"));
      }
    }
  } catch (e) {
    console.error("intake fetch failed:", d.store || "unknown-store", String(e?.message || e).slice(0, 250));
  }

  let got = false;
  let source = "";

  /* 2) نجرب صور الصفحة (بحد أقصى 8 مرشحات). المتاجر المعروفة: صور المنتجات فقط. الشعارات مرفوضة دائمًا. */
  for (const candidate of imageCandidates.slice(0, MAX_IMAGE_CANDIDATES)) {
    if (BAD_IMG.test(candidate)) continue;
    if (d.store && !isProductImageUrl(candidate)) continue;
    try {
      const img = await downloadBestImage(candidate);
      await env.STATE.put(`img:${userId}`, bytesToBase64(img.bytes), { expirationTtl: STATE_TTL });
      d.has_img = true;
      d.image_ext = img.ext;
      got = true;
      source = "الصفحة المباشرة";
      break;
    } catch (e) {
      console.error("direct image candidate failed:", String(e?.message || e).slice(0, 160));
    }
  }

  /* 3) خدمة معاينة كحل أخير: عند نقص الصورة أو الاسم */
  if ((!got || !d.title) && String(env.DISABLE_MICROLINK || "").toLowerCase() !== "true") {
    try {
      const ml = await fetchViaMicrolink(link);
      if (!d.store) d.store = detectStore(ml.finalUrl);
      if (!d.title && ml.title && !isGenericTitle(ml.title)) d.title = ml.title.slice(0, 150);
      if (!got && ml.image && !BAD_IMG.test(ml.image) && (!d.store || isProductImageUrl(ml.image))) {
        try {
          const img = await downloadBestImage(ml.image);
          await env.STATE.put(`img:${userId}`, bytesToBase64(img.bytes), { expirationTtl: STATE_TTL });
          d.has_img = true;
          d.image_ext = img.ext;
          got = true;
          source = "خدمة المعاينة";
        } catch (e) {
          console.error("microlink image download failed:", String(e?.message || e).slice(0, 160));
        }
      }
    } catch (e) {
      console.error("microlink failed:", String(e?.message || e).slice(0, 200));
    }
  }

  /* لا نثق في عنوان المتجر العام باعتباره اسم المنتج */
  if (d.title && isGenericTitle(d.title)) d.title = "";

  /* النشر عربي فقط: نترجم الاسم قبل المعاينة ونحتفظ بالأصلي للمراجعة */
  if (d.title && !hasArabic(d.title)) {
    const sourceTitle = d.title;
    const ar = await translateProductTitle(sourceTitle, env);
    if (hasArabic(ar)) { d.originalTitle = sourceTitle; d.title = ar; }
    else { d.originalTitle = sourceTitle; d.title = ""; }
  }

  await sendMessage(ref.chatId,
    `🏬 المتجر: ${d.store || "غير معروف"}\n` +
    (d.title ? `📝 الاسم: ${d.title}\n` : "📝 الاسم: لم يُستخرج — سأطلبه منك\n") +
    (d.price ? `💰 السعر: ${d.price} ريال\n` : "💰 السعر: لم يُستخرج — سأطلبه منك\n") +
    (d.old ? `🏷️ السعر السابق: ${d.old} ريال\n` : "") +
    (got || d.telegram_file_id ? `✅ تم تحميل صورة المنتج${source ? ` (${source})` : ""}.` : "⚠️ لم تُحمّل الصورة تلقائيًا؛ سأطلبها منك."), env);
  return advance(ref, userId, state, env);
}

async function processAdd(message, state, userId, ref, env) {
  const chatId = ref.chatId;
  const d = state.product;
  const text = message.text?.trim();

  const fileId = extractImageFileId(message);

  /* في المعاينة: إرسال صورة جديدة يبدّل صورة المنتج ثم يعيد المعاينة */
  if (fileId && state.step === "preview") {
    d.telegram_file_id = fileId;
    d.has_img = false;
    return sendPreview(ref, userId, state, env);
  }

  if (["category", "group", "preview"].includes(state.step))
    return sendMessage(chatId, "👆 استخدم الأزرار أعلاه، أو /cancel للإلغاء.", env);

  if (fileId) {
    d.telegram_file_id = fileId;
    d.has_img = false;
    return advance(ref, userId, state, env);
  }
  if (!text) return sendMessage(chatId, "أرسل نصًا أو صورة حسب المطلوب.", env);

  switch (state.step) {
    case "link": {
      const m = text.match(/https?:\/\/\S+/);
      if (!m) return sendMessage(chatId, "❌ لم أجد رابطًا. أرسل رابط المنتج كاملًا.", env);
      return intakeLink(ref, userId, state, m[0], env);
    }
    case "image":
      return sendMessage(chatId, "📸 أرسل صورة المنتج — الأفضل كـ «ملف» (📎 ← ملف) للحفاظ على الدقة.", env);
    case "title": {
      const typed = text.slice(0, 200);
      if (hasArabic(typed)) {
        d.title = typed;
      } else {
        const ar = await translateProductTitle(typed, env);
        if (hasArabic(ar)) {
          d.originalTitle = typed;
          d.title = ar;
        } else {
          d.originalTitle = typed;
          d.title = "";
          state.step = "title";
          await saveState(userId, state, env);
          return sendMessage(chatId,
            "⚠️ لم أتمكن من ترجمة الاسم تلقائيًا، لذلك لن أنشره بالإنجليزية ولن أحفظه كمنتج بعد.\\nاكتب اسم المنتج بالعربية فقط (يمكن إبقاء اسم الماركة والموديل بالإنجليزية).",
            env);
        }
      }
      break;
    }
    case "price": {
      const n = cleanNumber(text);
      if (!n) return sendMessage(chatId, "❌ السعر غير صحيح. أرسل رقمًا فقط، مثال: 69.00", env);
      d.price = n;
      if (d.old && Number(d.old) <= Number(n)) d.old = undefined;
      break;
    }
    case "old": {
      if (/^[-–0٠]$/.test(text)) d.old = null;
      else {
        const n = cleanNumber(text);
        if (!n || Number(n) <= Number(d.price))
          return sendMessage(chatId, "❌ يجب أن يكون السعر القديم أعلى من الحالي. أرسل رقمًا أو - لتخطي.", env);
        d.old = n;
      }
      break;
    }
  }
  return advance(ref, userId, state, env);
}

async function sendPreview(ref, userId, state, env) {
  const d = state.product;
  d.discount = calcDiscount(d.price, d.old);
  state.step = "preview";
  await saveState(userId, state, env);

  const caption = (
    `👀 معاينة قبل النشر\n\n${productCard(d)}\n📂 القسم: ${CATEGORIES[d.category]}\n` +
    (d.group ? "🔁 مرتبط بمنتج مماثل (مقارنة أسعار)\n" : "") +
    `🔗 ${d.link}`
  );
  const markup = { inline_keyboard: [
    [{ text: "✅ نشر", callback_data: "pub" }, { text: "❌ إلغاء", callback_data: "cx" }],
    [{ text: "✏️ عدّل الاسم", callback_data: "pt" }, { text: "🔄 أعد الترجمة", callback_data: "pr" }]
  ] };

  try {
    const staged = !d.telegram_file_id ? await loadStagedImage(userId, d, env) : null;
    if (staged) {
      await telegramSendPhotoFile(ref.chatId, staged.bytes, staged.ext, caption.slice(0, 1024), markup, env);
    } else {
      await telegram("sendPhoto", {
        chat_id: ref.chatId, photo: d.telegram_file_id,
        caption: caption.slice(0, 1024), reply_markup: markup
      }, env);
    }
  } catch {
    await sendMessage(ref.chatId, caption, env, { reply_markup: markup });
  }
}

async function publishProduct(ref, userId, env) {
  const state = await getState(userId, env);
  if (!state?.product || state.step !== "preview")
    return sendMessage(ref.chatId, "❌ انتهت جلسة إضافة المنتج. ابدأ من جديد.", env);

  const draft = state.product;

  /* حاجز إلزامي: لا يُحفظ ولا يُنشر أي منتج عنوانه غير عربي */
  if (!hasArabic(draft.title)) {
    const sourceTitle = draft.originalTitle || draft.title || "";
    const ar = await translateProductTitle(sourceTitle, env);
    if (!hasArabic(ar)) {
      state.step = "title";
      await saveState(userId, state, env);
      return sendMessage(ref.chatId,
        "⛔ أوقفت النشر لأن اسم المنتج لم يُترجم إلى العربية. لم يتم حفظ المنتج ولم يتم نشره.\\nأرسل الآن اسم المنتج بالعربية (يمكن إبقاء الماركة والموديل بالإنجليزية).",
        env);
    }
    if (!draft.originalTitle) draft.originalTitle = sourceTitle;
    draft.title = ar;
    await saveState(userId, state, env);
  }

  await env.STATE.delete(`state:${userId}`); // قفل لمنع النشر المكرر (نُبقي الصورة المؤقتة للمحاولة مجددًا)
  await sendMessage(ref.chatId, "⏳ جاري حفظ المنتج والصورة في GitHub...", env);
  let imagePath;
  let saved = false; // بعد الحفظ في products.json لا نحذف الصورة أبدًا

  try {
    let img;
    if (draft.telegram_file_id) img = await downloadTelegramImage(draft.telegram_file_id, env);
    else {
      img = await loadStagedImage(userId, draft, env);
      if (!img) {
        /* انتهت الصورة المؤقتة → نطلبها يدويًا */
        draft.has_img = false;
        await saveState(userId, { step: "image", product: draft }, env);
        return sendMessage(ref.chatId, "⚠️ لم أجد صورة المنتج. أرسل صورته — الأفضل كـ «ملف» (📎 ← ملف) للحفاظ على الدقة.", env);
      }
    }

    imagePath = `products/product-${Date.now()}-${shortId()}.${img.ext}`;
    await githubUploadBinary(imagePath, img.bytes, `Add product image: ${draft.title}`, env);

    /* الاسم يُحفظ كما هو (يدوي/الأصلي). الاسم العربي يُضاف لاحقًا بزر «أضف الاسم العربي وانشره». */
    const product = {
      id: shortId(),
      title: String(draft.title || "").trim(),
      ...(draft.originalTitle ? { originalTitle: String(draft.originalTitle).slice(0, 200) } : {}),
      price: draft.price,
      ...(draft.old ? { old: draft.old } : {}),
      discount: draft.discount || 0,
      link: draft.link,
      store: draft.store || "",
      image: imagePath,
      featured: false,
      expired: false,
      createdAt: new Date().toISOString()
    };

    await updateProducts(env, products => {
      if (draft.group) {
        const other = findProduct(products, draft.group);
        if (other) {
          other.product.groupId = other.product.groupId || `g${shortId()}`;
          product.groupId = other.product.groupId;
        }
      }
      products[draft.category].push(product);
    }, `Add product: ${draft.title}`);
    saved = true;
    await env.STATE.delete(`img:${userId}`).catch(console.error);

    await pushHistory(env, product.id, product.price).catch(console.error);

    /* نشر تلقائي في قناة تيليجرام — نرسل الصورة من الذاكرة مباشرة (لا ننتظر GitHub Pages) */
    let channelOk = true;
    if (env.CHANNEL_ID) {
      channelOk = await postToChannel(ref, product.id, env, { bytes: img.bytes, ext: img.ext }, product);
    }

    /* النشر في X أصبح يدويًا مساعدًا لتجنب استهلاك رصيد API. */

    const rows = [
      [{ text: "➕ إضافة منتج آخر", callback_data: "add_product" }],
      [{ text: "📦 عرض المنتج", callback_data: `p:${product.id}` }],
      [{ text: "🔙 القائمة", callback_data: "back_menu" }]
    ];

    await sendMessage(ref.chatId,
      `✅ تم حفظ المنتج بنجاح.\n\n🏬 ${product.store || "—"}\n📂 ${CATEGORIES[draft.category]}\n` +
      `🔻 الخصم: ${product.discount}%\n🔥 قوة العرض: ${dealScore(product)}` +
      (product.groupId ? "\n🔁 مرتبط بمقارنة الأسعار" : "") +
      (env.CHANNEL_ID && !channelOk ? "\n\n⚠️ فشل النشر في القناة. يمكنك إعادة المحاولة من صفحة المنتج." : ""),
      env, { reply_markup: { inline_keyboard: rows } });
  } catch (e) {
    console.error(e);
    if (saved) {
      /* المنتج محفوظ فعلًا — لا نحذف الصورة ولا نعيد الجلسة */
      await sendMessage(ref.chatId, "⚠️ تم حفظ المنتج، لكن حدث خطأ بعد الحفظ. راجعه من قائمة المنتجات.", env).catch(console.error);
      return;
    }
    if (imagePath) await githubDeleteFile(imagePath, env);
    await saveState(userId, state, env);
    await sendMessage(ref.chatId, "❌ فشل حفظ المنتج. لم يُضف شيء.\nاضغط ✅ نشر مرة أخرى للمحاولة، أو /cancel.", env);
  }
}

/* =========================
   WhatsApp Channel via Whapi.Cloud
   Required Cloudflare bindings:
   WHAPI_TOKEN (Secret), WHATSAPP_NEWSLETTER_ID (Variable)
========================= */

async function whapiRequest(path, body, env) {
  if (!env.WHAPI_TOKEN) throw new Error("WHAPI_TOKEN غير مضبوط في Cloudflare.");
  if (!env.WHATSAPP_NEWSLETTER_ID) throw new Error("WHATSAPP_NEWSLETTER_ID غير مضبوط في Cloudflare.");
  const response = await fetch(`https://gate.whapi.cloud${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHAPI_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ to: env.WHATSAPP_NEWSLETTER_ID, ...body }),
    signal: AbortSignal.timeout(25000)
  });
  const raw = await response.text();
  let result;
  try { result = raw ? JSON.parse(raw) : {}; } catch { result = { raw: raw.slice(0, 500) }; }
  if (!response.ok) {
    throw new Error(`Whapi ${path} failed (${response.status}): ${JSON.stringify(result).slice(0, 500)}`);
  }
  return result;
}

function whatsappCaption(p, env) {
  const tgLink = env.CHANNEL_LINK || DEFAULT_CHANNEL_LINK;
  const waLink = env.WHATSAPP_LINK || DEFAULT_WHATSAPP_LINK;
  const storeLink = env.STORE_LINK || DEFAULT_STORE_LINK;
  const lines = [
    `🔥 ${p.title}`,
    "",
    `🟢 السعر الحالي: ${p.price} ريال`,
    p.old && Number(p.old) > Number(p.price) ? `🔴 السعر السابق: ${p.old} ريال` : "",
    p.discount && Number(p.discount) > 0 ? `🏷️ نسبة الخصم: ${p.discount}%` : "",
    p.store ? `🏬 المتجر: ${p.store}` : "",
    "",
    `🛒 رابط المنتج: ${p.link || goUrl(env, p)}`,
    "",
    "💜 وفّرها صح | نختار لك العروض بعناية",
    tgLink ? `📢 تيليجرام: ${tgLink}` : "",
    waLink ? `💬 قناة واتساب: ${waLink}` : "",
    storeLink ? `🛍️ متجرنا: ${storeLink}` : "",
    "",
    "#وفرها_صح #عروض #تسوق"
  ].filter(Boolean);
  // WhatsApp image captions have a hard limit; trim safely while preserving purchase link and price.
  let caption = lines.join("\n");
  if (caption.length > 1024) {
    const essential = [`🔥 ${p.title}`, `🟢 السعر الحالي: ${p.price} ريال`, p.old && Number(p.old) > Number(p.price) ? `🔴 السعر السابق: ${p.old} ريال` : "", p.discount ? `🏷️ الخصم: ${p.discount}%` : "", `🛒 رابط المنتج: ${p.link || goUrl(env, p)}`, storeLink ? `🛍️ متجرنا: ${storeLink}` : "", "💜 وفّرها صح"].filter(Boolean);
    caption = essential.join("\n\n");
  }
  return caption.slice(0, 1024);
}

async function publishWhatsAppChannel(p, env) {
  if (!env.WHAPI_TOKEN || !env.WHATSAPP_NEWSLETTER_ID) {
    return { ok: false, skipped: true, message: "أضف WHAPI_TOKEN وWHATSAPP_NEWSLETTER_ID في Cloudflare." };
  }
  const caption = whatsappCaption(p, env);

  // Prefer sending the actual stored product image. Whapi accepts data-URI Base64.
  if (p.image) {
    const bytes = await readRepoImage(env, p.image);
    const lower = String(p.image).toLowerCase().split("?")[0];
    const mime = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : "image/jpeg";
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const media = `data:${mime};name=product.${ext};base64,${bytesToBase64(bytes)}`;
    await whapiRequest("/messages/image", { media, caption }, env);
    return { ok: true, image: true };
  }

  // If no product image exists, publish the text instead of silently failing.
  await whapiRequest("/messages/text", { body: caption }, env);
  return { ok: true, image: false };
}

/* نشر في القناة مع مقارنة الأسعار وروابط التتبع
   يرجع true عند النجاح و false عند الفشل.
   preloaded = { bytes, ext } لو الصورة متوفرة في الذاكرة (أسرع)
   fallback  = كائن المنتج لو لم يظهر بعد في قراءة GitHub */
async function postToChannel(ref, id, env, preloaded = null, fallback = null, opts = {}) {
  if (!env.CHANNEL_ID) {
    await sendMessage(ref.chatId, "❌ لم يتم ضبط CHANNEL_ID.", env);
    return false;
  }
  const products = await getProducts(env);
  let located = findProduct(products, id);
  if (!located && fallback) located = { category: "", product: fallback };
  if (!located) {
    await sendMessage(ref.chatId, "❌ المنتج غير موجود.", env);
    return false;
  }
  const p = located.product;

  /* لا تسمح إعادة النشر بعنوان إنجليزي؛ حاول ترجمته وحفظ النسخة العربية أولًا */
  if (!hasArabic(p.title)) {
    const sourceTitle = p.originalTitle || p.title || "";
    const ar = await translateProductTitle(sourceTitle, env);
    if (!hasArabic(ar)) {
      await sendMessage(ref.chatId,
        "⛔ لم أنشر المنتج لأن ترجمته إلى العربية فشلت. عدّل اسم المنتج إلى العربية ثم أعد المحاولة.",
        env);
      return false;
    }
    p.originalTitle = p.originalTitle || sourceTitle;
    p.title = ar;
    if (located.category) {
      await updateProducts(env, data => {
        const item = findProduct(data, id);
        if (item) {
          item.product.title = ar;
          item.product.originalTitle = item.product.originalTitle || sourceTitle;
        }
      }, `Translate product title: ${id}`);
    }
  }

  let offers = groupOf(products, p).sort((a, b) => Number(a.price) - Number(b.price));
  if (!offers.length) offers = [p];

  let caption = `🔥 ${p.title}` + `\n\n🟢 السعر الحالي: ${p.price} ريال` + (p.old && Number(p.old) > Number(p.price) ? `\n🔴 السعر السابق: ${p.old} ريال` : "") + (p.discount ? `\n🏷️ الخصم: ${p.discount}%` : "");
  if (offers.length > 1)
    caption += `\n\n🔎 مقارنة الأسعار:\n` + offers.map((o, i) => `${i === 0 ? "👑" : "•"} ${o.store || "؟"}: ${o.price} ريال`).join("\n");
  caption += "\n\n💜 وَفِّرْهَا صَحّ";
  const links = footerLinks(env);
  if (links.length) caption += "\n\n" + links.join("\n");

  const buttons = offers.slice(0, 4).map(o => [{ text: `🛒 ${o.store || "اشترِ"} — ${o.price} ريال`, url: goUrl(env, o) }]);
  const markup = { inline_keyboard: buttons };

  try {
    if (p.image) {
      let bytes, ext;
      if (preloaded) ({ bytes, ext } = preloaded);
      else {
        bytes = await readRepoImage(env, p.image);
        ext = (p.image.split(".").pop() || "jpg").toLowerCase();
      }
      await telegramSendPhotoFile(env.CHANNEL_ID, bytes, ext, caption.slice(0, 1024), markup, env);
    } else {
      await sendMessage(env.CHANNEL_ID, caption, env, { reply_markup: markup });
    }
    await sendMessage(ref.chatId, "✅ تم النشر في قناة تيليجرام.", env);
    // Publish to WhatsApp Channel automatically via Whapi.Cloud.
    // A WhatsApp failure does not undo the successful Telegram post.
    try {
      const waResult = await publishWhatsAppChannel(p, env);
      if (waResult.ok) {
        await sendMessage(ref.chatId,
          waResult.image
            ? "✅ تم النشر في تيليجرام وواتساب مع صورة المنتج."
            : "✅ تم النشر في تيليجرام وواتساب كنص؛ لا توجد صورة محفوظة لهذا المنتج.",
          env);
      } else {
        await sendMessage(ref.chatId,
          `⚠️ نُشر المنتج في تيليجرام، لكن النشر التلقائي في واتساب غير مفعّل.\n${waResult.message}`,
          env);
      }
    } catch (waError) {
      const waErrorText = String(waError?.message || waError || "Unknown error").slice(0, 500);
      console.error("WhatsApp channel publish failed:", waErrorText);
      await sendMessage(ref.chatId,
        `⚠️ نُشر المنتج في تيليجرام، لكن فشل نشره في واتساب.\nالسبب: ${waErrorText}`,
        env).catch(console.error);
    }
    return true;
  } catch (e) {
    const errorText = String(e?.message || e || "Unknown error").slice(0, 700);
    console.error("postToChannel failed:", errorText);
    await sendMessage(ref.chatId, `❌ فشل النشر في القناة.\nالسبب: ${errorText}`, env);
    return false;
  }
}

/* =========================
   X API — OAuth 2.0 + publish
========================= */

/*
  Cloudflare bindings:
  X_CLIENT_ID     Secret
  X_CLIENT_SECRET Secret (optional for public PKCE clients)
  X_ACCESS_TOKEN  Secret (initial user access token)
  X_REFRESH_TOKEN Secret (initial refresh token; request offline.access)
  X_AUTO_POST     Variable: true or false

  Required OAuth scopes: tweet.read tweet.write users.read offline.access
*/

async function refreshXAccessToken(env) {
  const savedRefresh = await env.STATE.get("x:refresh_token");
  const refreshToken = savedRefresh || env.X_REFRESH_TOKEN;

  if (!env.X_CLIENT_ID || !refreshToken) {
    throw new Error("إعدادات X ناقصة: يلزم X_CLIENT_ID و X_REFRESH_TOKEN.");
  }

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.X_CLIENT_ID
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  // Confidential clients use Basic auth. Public PKCE clients omit it.
  if (env.X_CLIENT_SECRET) {
    headers.Authorization = `Basic ${btoa(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`)}`;
  }

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers,
    body: form
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.access_token) {
    throw new Error(`X token refresh failed (${response.status}): ${JSON.stringify(result)}`);
  }

  await env.STATE.put("x:access_token", result.access_token, {
    expirationTtl: Math.max(60, Number(result.expires_in || 7200) - 120)
  });

  // X rotates the refresh token. Keep the newest token in KV.
  if (result.refresh_token) {
    await env.STATE.put("x:refresh_token", result.refresh_token);
  }

  return result.access_token;
}

async function getXAccessToken(env, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await env.STATE.get("x:access_token");
    if (cached) return cached;
    if (env.X_ACCESS_TOKEN) return env.X_ACCESS_TOKEN;
  }

  return refreshXAccessToken(env);
}

async function postTextToX(text, env) {
  let token = await getXAccessToken(env);

  const send = accessToken => fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: String(text).slice(0, 280) })
  });

  let response = await send(token);

  if (response.status === 401 && (env.X_REFRESH_TOKEN || await env.STATE.get("x:refresh_token"))) {
    token = await getXAccessToken(env, true);
    response = await send(token);
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result?.data?.id) {
    throw new Error(`X post failed (${response.status}): ${JSON.stringify(result)}`);
  }

  return result;
}

function buildXProductText(product, env) {
  // In X's prepared post, use the original saved product/affiliate URL,
  // not the Cloudflare /go/:id tracking redirect.
  const productUrl = String(product.link || "").trim();

  const discount = Number(product.discount) || calcDiscount(product.price, product.old);

  /* نقص العنوان فقط (لا نقص الرابط أو الوسوم) */
  let title = String(product.title || "");
  if (title.length > 110) title = title.slice(0, 107).trimEnd() + "...";

  const storeLink = env.STORE_LINK || DEFAULT_STORE_LINK;
  // X has a short post limit: include the product link and store link first.
  // Avoid adding channel URLs here so the post is more likely to fit.
  const parts = [
    `🔥 ${title}`,
    `💰 ${product.price} ريال`,
    product.old && Number(product.old) > Number(product.price) ? `السابق ${product.old} ريال` : "",
    discount > 0 ? `🔻 خصم ${discount}%` : "",
    product.store ? `🏬 ${product.store}` : "",
    `🛒 ${productUrl}`,
    storeLink ? `🛍️ متجرنا: ${storeLink}` : "",
    "#وفرها_صح #عروض"
  ].filter(Boolean);

  let text = parts.join("\n");
  if (text.length > 280) {
    // Preserve both links and hashtags; shorten only the product title.
    const fixed = parts.slice(1).join("\n");
    const available = Math.max(10, 280 - fixed.length - 5);
    const shortTitle = title.length > available ? title.slice(0, Math.max(1, available - 3)).trimEnd() + "..." : title;
    parts[0] = `🔥 ${shortTitle}`;
    text = parts.join("\n");
  }
  return text.slice(0, 280);
}

async function publishProductToX(product, env) {
  if (!env.X_CLIENT_ID || (!env.X_ACCESS_TOKEN && !env.X_REFRESH_TOKEN &&
      !(await env.STATE.get("x:access_token")) && !(await env.STATE.get("x:refresh_token")))) {
    throw new Error("لم يتم إعداد رموز X. تحقق من X_CLIENT_ID و X_ACCESS_TOKEN و X_REFRESH_TOKEN.");
  }

  return postTextToX(buildXProductText(product, env), env);
}

async function postExistingProductToX(ref, id, env) {
  const products = await getProducts(env);
  const located = findProduct(products, id);
  if (!located) {
    await sendMessage(ref.chatId, "❌ المنتج غير موجود.", env);
    return false;
  }

  const product = located.product;
  const postText = buildXProductText(product, env);
  const composeUrl = `https://x.com/intent/post?text=${encodeURIComponent(postText)}`;
  const keyboard = { inline_keyboard: [
    [{ text: "✍️ فتح X بالنص الجاهز", url: composeUrl }],
    ...(product.image && env.SITE_URL ? [[{ text: "🖼️ فتح صورة المنتج", url: new URL(String(product.image).replace(/^\//, ""), env.SITE_URL.endsWith("/") ? env.SITE_URL : `${env.SITE_URL}/`).toString() }]] : []),
    [{ text: "📦 العودة إلى المنتج", callback_data: `p:${id}` }]
  ]};

  const instructions = "📝 جهزت لك منشور X بدون استخدام رصيد API.\n\n" +
    "1) اضغط «فتح X بالنص الجاهز».\n" +
    "2) راجع النص والرابط ثم أرفق صورة المنتج يدويًا من جهازك إذا لم تظهر تلقائيًا.\n" +
    "3) اضغط نشر داخل X.\n\n" +
    "النص الجاهز:\n" + postText;

  // Try to deliver the product image to the admin in Telegram, if it is publicly available.
  if (product.image && env.SITE_URL) {
    try {
      const site = env.SITE_URL.endsWith("/") ? env.SITE_URL : `${env.SITE_URL}/`;
      const imageUrl = new URL(String(product.image).replace(/^\//, ""), site).toString();
      const response = await telegram("sendPhoto", {
        chat_id: ref.chatId,
        photo: imageUrl,
        caption: ("🖼️ صورة المنتج لإرفاقها في X\n\n" + postText).slice(0, 1024),
        reply_markup: keyboard
      }, env);
      return Boolean(response?.ok);
    } catch (error) {
      console.error("Could not send product image for manual X post:", error);
    }
  }

  await sendMessage(ref.chatId, instructions, env, { reply_markup: keyboard });
  return true;
}

/* =========================
   Search
========================= */

async function processSearch(message, userId, ref, env) {
  const query = message.text?.trim();
  if (!query) return sendMessage(ref.chatId, "🔎 أرسل اسم المنتج أو جزءًا منه.", env);
  const q = normalizeText(query);
  /* البحث في الاسم العربي والاسم الأصلي (الإنجليزي) معًا */
  const matches = allProducts(await getProducts(env)).filter(x =>
    normalizeText(`${x.product.title || ""} ${x.product.originalTitle || ""}`).includes(q));
  await clearState(userId, env);

  if (!matches.length)
    return sendMessage(ref.chatId, `🔎 لا يوجد منتج يطابق:\n${query}`, env,
      { reply_markup: { inline_keyboard: [[{ text: "🔙 المنتجات", callback_data: "list_products" }]] } });

  const rows = matches.slice(0, 40).map(({ category, product }) => [{
    text: `${CATEGORIES[category]} — ${String(product.title || "منتج").slice(0, 40)}`, callback_data: `p:${product.id}`
  }]);
  rows.push([{ text: "🔙 المنتجات", callback_data: "list_products" }]);
  await sendMessage(ref.chatId, `🔎 نتائج البحث عن: ${query}\n(${matches.length} نتيجة)\n\nاختر المنتج:`, env,
    { reply_markup: { inline_keyboard: rows } });
}

/* =========================
   Callbacks
========================= */

async function handleCallback(callback, env) {
  const userId = String(callback.from.id);
  const ref = {
    chatId: callback.message?.chat?.id ?? callback.from.id,
    messageId: callback.message?.message_id
  };
  const [action, ...args] = (callback.data || "").split(":");
  const expired = () => sendMessage(ref.chatId, "❌ انتهت جلسة إضافة المنتج. ابدأ من جديد.", env);

  switch (action) {
    case "back_menu": await clearState(userId, env); return showMenu(ref, env);
    case "add_product": return startAdd(ref, userId, env);
    case "list_products": await clearState(userId, env); return listCategories(ref, env);
    case "stores": return listStores(ref, env);
    case "st": return listByStore(ref, args[0], Number(args[1]) || 0, env);
    case "reviews": return showReviews(ref, env);
    case "rvd": {
      await deleteReview(env, args[0]);
      return showReviews(ref, env);
    }
    case "stats": return showStats(ref, env);
    case "deals": return showDeals(ref, Number(args[0]) || 0, env);
    case "featured": return showFeatured(ref, Number(args[0]) || 0, env);
    case "c": return listCategoryPage(ref, args[0], Number(args[1]) || 0, env);
    case "p": return showProduct(ref, args[0], env);
    case "e": return showEditMenu(ref, args[0], env);

    case "search_product":
      await saveState(userId, { step: "search_product" }, env);
      return sendMessage(ref.chatId, "🔎 أرسل اسم المنتج أو جزءًا منه:", env);

    case "checkprices": {
      await sendMessage(ref.chatId, "⏳ جاري فحص دفعة من المنتجات...", env);
      const r = await checkPrices(env);
      return sendMessage(ref.chatId, `✅ تم فحص ${r.checked} منتج • تغيّر السعر في ${r.changed}`, env);
    }

    case "ef": {
      const [field, id] = args;
      if (field === "category")
        return ui(ref, "📂 اختر القسم الجديد:", [...categoryButtons("nc", id), [{ text: "🔙 رجوع", callback_data: `e:${id}` }]], env);
      if (field === "image" || EDIT_FIELDS[field]) {
        await saveState(userId, { step: "editing", field, id }, env);
        return sendMessage(ref.chatId, field === "image" ? "🖼️ أرسل الصورة الجديدة للمنتج:" : EDIT_FIELDS[field].prompt, env);
      }
      return;
    }

    case "nc": {
      const [newCategory, id] = args;
      if (!CATEGORIES[newCategory]) return ui(ref, "❌ القسم غير موجود.", null, env);
      const ok = await updateProducts(env, products => {
        const located = findProduct(products, id);
        if (!located) return false;
        if (located.category !== newCategory) {
          products[located.category] = products[located.category].filter(p => String(p.id) !== String(id));
          products[newCategory].push(located.product);
        }
        return true;
      }, `Move product ${id} to ${newCategory}`);
      if (!ok) return ui(ref, "❌ المنتج غير موجود.", null, env);
      return ui(ref, `✅ تم نقل المنتج إلى ${CATEGORIES[newCategory]}`, editDoneButtons(id), env);
    }

    case "tg": {
      const [flag, id] = args;
      if (!["featured", "expired"].includes(flag)) return;
      await updateProducts(env, products => {
        const located = findProduct(products, id);
        if (located) located.product[flag] = !located.product[flag];
      }, `Toggle ${flag}: ${id}`);
      return showProduct(ref, id, env);
    }

    /* ربط منتجين كمقارنة أسعار */
    case "lk": {
      const id = args[0];
      const products = await getProducts(env);
      const located = findProduct(products, id);
      if (!located) return ui(ref, "❌ المنتج غير موجود.", null, env);
      const found = similarTo(products, located.product.title, located.product.store, id, 0.15, 6, located.product.originalTitle || "");
      const rows = found.map(({ product: p }) => [{
        text: `${p.store || "؟"} • ${String(p.title).slice(0, 32)} (${p.price})`, callback_data: `lk2:${id}:${p.id}`
      }]);
      rows.push([{ text: "🔙 رجوع", callback_data: `p:${id}` }]);
      return ui(ref, found.length ? "🔗 اختر المنتج المماثل في المتجر الآخر:" : "لا توجد منتجات مشابهة في متاجر أخرى.", rows, env);
    }

    case "lk2": {
      const [id, other] = args;
      await updateProducts(env, products => {
        const a = findProduct(products, id), b = findProduct(products, other);
        if (!a || !b) return;
        const gid = b.product.groupId || a.product.groupId || `g${shortId()}`;
        a.product.groupId = gid;
        b.product.groupId = gid;
      }, `Link ${id} with ${other}`);
      return showProduct(ref, id, env);
    }

    case "ul": {
      const id = args[0];
      await updateProducts(env, products => {
        const a = findProduct(products, id);
        if (!a?.product.groupId) return;
        const gid = a.product.groupId;
        delete a.product.groupId;
        const rest = allProducts(products).filter(x => x.product.groupId === gid);
        if (rest.length === 1) delete rest[0].product.groupId;
      }, `Unlink ${id}`);
      return showProduct(ref, id, env);
    }

    /* قبول تحديث سعر مقترح من الفحص الدوري */
    case "up": {
      const [id, price] = args;
      const result = await updateProducts(env, products => {
        const located = findProduct(products, id);
        if (!located) return null;
        located.product.price = String(Number(price));
        located.product.discount = calcDiscount(located.product.price, located.product.old);
        return located.product;
      }, `Update price: ${id}`);
      if (!result) return ui(ref, "❌ المنتج غير موجود.", null, env);
      await pushHistory(env, id, price).catch(console.error);
      await checkAlerts(env, result, Number(price)).catch(console.error);
      return ui(ref, `✅ تم تحديث السعر إلى ${price} ريال`, [[{ text: "📦 عرض المنتج", callback_data: `p:${id}` }]], env);
    }

    case "ch": {
      await postToChannel(ref, args[0], env);
      return;
    }

    case "x": {
      await postExistingProductToX(ref, args[0], env);
      return;
    }

    case "d": {
      const located = findProduct(await getProducts(env), args[0]);
      if (!located) return ui(ref, "❌ المنتج غير موجود.", null, env);
      return ui(ref, `⚠️ هل أنت متأكد من حذف المنتج؟\n\n${located.product.title}`, [
        [{ text: "🗑️ نعم، احذف", callback_data: `dc:${args[0]}` }],
        [{ text: "❌ إلغاء", callback_data: `p:${args[0]}` }]
      ], env);
    }

    case "dc": {
      const id = args[0];
      let removed;
      await updateProducts(env, products => {
        const located = findProduct(products, id);
        if (!located) return;
        removed = located.product;
        products[located.category] = products[located.category].filter(p => String(p.id) !== String(id));
        if (removed.groupId) {
          const rest = allProducts(products).filter(x => x.product.groupId === removed.groupId);
          if (rest.length === 1) delete rest[0].product.groupId;
        }
      }, `Delete product ${id}`);
      if (!removed) return ui(ref, "❌ المنتج غير موجود.", null, env);
      await githubDeleteFile(removed.image, env);
      return ui(ref, "✅ تم حذف المنتج بنجاح.", [[{ text: "🔙 المنتجات", callback_data: "list_products" }]], env);
    }

    /* مراحل الإضافة */
    case "cat": {
      const st = await getState(userId, env);
      if (!st?.product || st.step !== "category" || !CATEGORIES[args[0]]) return expired();
      st.product.category = args[0];
      return advance(ref, userId, st, env);
    }

    case "gl": {
      const st = await getState(userId, env);
      if (!st?.product || st.step !== "group") return expired();
      st.product.group = args[0] === "0" ? "" : args[0];
      return advance(ref, userId, st, env);
    }

    case "pub": return publishProduct(ref, userId, env);

    /* تعديل الاسم قبل النشر */
    case "pt": {
      const st = await getState(userId, env);
      if (!st?.product || st.step !== "preview") return expired();
      st.step = "title";
      await saveState(userId, st, env);
      return sendMessage(ref.chatId, `✏️ أرسل الاسم الجديد للمنتج (يفضّل بالعربي):\n\nالحالي: ${st.product.title}`, env);
    }

    case "pr": {
      const st = await getState(userId, env);
      if (!st?.product || st.step !== "preview") return expired();
      const src = st.product.originalTitle || st.product.title;
      const ar = await translateProductTitle(src, env);
      if (!hasArabic(ar))
        return sendMessage(ref.chatId, "⚠️ تعذرت الترجمة الآن. اضغط «✏️ عدّل الاسم» واكتب الاسم العربي.", env);
      if (!st.product.originalTitle && !hasArabic(st.product.title)) st.product.originalTitle = st.product.title;
      st.product.title = ar;
      return sendPreview(ref, userId, st, env);
    }

    case "cx":
      await clearState(userId, env);
      await sendMessage(ref.chatId, "تم إلغاء العملية ❌", env);
      return showMenu({ chatId: ref.chatId }, env);

    default:
      return sendMessage(ref.chatId, "❌ هذا الزر لم يعد صالحًا. افتح /menu من جديد.", env);
  }
}