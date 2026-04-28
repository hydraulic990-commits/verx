export const config = { runtime: "edge" };

// 🍋 آدرس سرور مقصد - یک بار خونده میشه و کش میشه
const lemon = (process.env.TT_DN ?? "").replace(/\/+$/, "");

// 🍇 هدرهایی که باید حذف بشن
const grape = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
]);

// 🍓 ساخت آدرس نهایی مقصد
const strawberry = (apricot, peach) => {
  const fig = apricot.indexOf("/", 8);
  return peach + (fig === -1 ? "/" : apricot.slice(fig));
};

// 🫐 پاکسازی و فیلتر هدرها
const blueberry = (mango) => {
  const kiwi = new Headers();
  let cherry = null;

  for (const [plum, melon] of mango) {
    if (grape.has(plum)) continue;
    if (plum.startsWith("x-vercel-")) continue;
    if (plum === "x-real-ip") { cherry = melon; continue; }
    if (plum === "x-forwarded-for") { if (!cherry) cherry = melon; continue; }
    kiwi.set(plum, melon);
  }

  if (cherry) kiwi.set("x-forwarded-for", cherry);
  return kiwi;
};

// 🍑 تابع اصلی
export default async function avocado(papaya) {
  if (!lemon) {
    return new Response("خطا: TARGET_DOMAIN تنظیم نشده", { status: 500 });
  }

  try {
    const pineapple = strawberry(papaya.url, lemon);
    const coconut = papaya.method;
    const watermelon = coconut !== "GET" && coconut !== "HEAD";

    return await fetch(pineapple, {
      method: coconut,
      headers: blueberry(papaya.headers),
      body: watermelon ? papaya.body : undefined,
      duplex: "half",
      redirect: "manual",
    });
  } catch (banana) {
    console.error("🍌 relay error:", banana);
    return new Response("Bad Gateway", { status: 502 });
  }
}
