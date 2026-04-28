export const settings = { runtime: "edge" };

const DESTINATION_BASE = (process.env.DESTINATION_URL || "").replace(/\/$/, "");

const HEADERS_TO_REMOVE = new Set([
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

export default async function proxyHandler(request) {
  if (!DESTINATION_BASE) {
    return new Response("Misconfigured: DESTINATION_URL environment variable is missing", { 
      status: 500 
    });
  }

  try {
    const pathIndex = request.url.indexOf("/", 8);
    const targetAddress =
      pathIndex === -1 
        ? DESTINATION_BASE + "/" 
        : DESTINATION_BASE + request.url.slice(pathIndex);

    const outgoingHeaders = new Headers();
    let realClientIp = null;

    for (const [headerName, headerValue] of request.headers) {
      if (HEADERS_TO_REMOVE.has(headerName)) continue;
      if (headerName.startsWith("x-vercel-")) continue;

      if (headerName === "x-real-ip") {
        realClientIp = headerValue;
        continue;
      }

      if (headerName === "x-forwarded-for") {
        if (!realClientIp) realClientIp = headerValue;
        continue;
      }

      outgoingHeaders.set(headerName, headerValue);
    }

    if (realClientIp) {
      outgoingHeaders.set("x-forwarded-for", realClientIp);
    }

    const httpMethod = request.method;
    const shouldIncludeBody = httpMethod !== "GET" && httpMethod !== "HEAD";

    return await fetch(targetAddress, {
      method: httpMethod,
      headers: outgoingHeaders,
      body: shouldIncludeBody ? request.body : undefined,
      duplex: "half",
      redirect: "manual",
    });
  } catch (error) {
    console.error("Proxy relay encountered an error:", error);
    return new Response("Bad Gateway: Relay connection failed", { status: 502 });
  }
}
