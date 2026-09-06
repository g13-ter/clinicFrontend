import { isIP } from "node:net";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

const firstForwardedAddress = (value: string | null): string =>
  value?.split(",", 1)[0]?.trim() ?? "";

const jsonError = (message: string, status: number): Response =>
  Response.json({ success: false, message }, { status });

export default {
  async fetch(request: Request): Promise<Response> {
    const backendApiUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
    const proxySecret = process.env.LOGIN_PROXY_SECRET;
    if (!backendApiUrl || !proxySecret) {
      return jsonError("API proxy is not configured", 503);
    }

    const requestUrl = new URL(request.url);
    const path = requestUrl.searchParams.get("path") ?? "";
    requestUrl.searchParams.delete("path");
    if (!/^[A-Za-z0-9/_-]*$/.test(path)) {
      return jsonError("Invalid API path", 400);
    }

    // Vercel sets this header from the connection at its edge. It is read
    // inside the trusted function and forwarded under an application-owned
    // header authenticated with a secret shared only with the backend.
    const clientIp = firstForwardedAddress(
      request.headers.get("x-vercel-forwarded-for"),
    ) || firstForwardedAddress(request.headers.get("x-forwarded-for"));
    if (!isIP(clientIp)) {
      return jsonError("Client address is unavailable", 503);
    }

    const upstreamUrl = new URL(`${backendApiUrl}/${path}`);
    upstreamUrl.search = requestUrl.search;

    const headers = new Headers(request.headers);
    for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");
    headers.delete("x-schoolcare-client-ip");
    headers.delete("x-schoolcare-proxy-secret");
    // Avoid forwarding a browser compression negotiation through Node fetch.
    // The runtime may transparently decompress the upstream body while
    // retaining Content-Encoding, which browsers reject as a decoding error.
    headers.set("accept-encoding", "identity");
    headers.set("x-schoolcare-client-ip", clientIp);
    headers.set("x-schoolcare-proxy-secret", proxySecret);

    try {
      const hasBody = request.method !== "GET" && request.method !== "HEAD";
      const upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: hasBody ? await request.arrayBuffer() : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      const responseHeaders = new Headers(upstream.headers);
      for (const header of HOP_BY_HOP_HEADERS) responseHeaders.delete(header);
      responseHeaders.delete("content-encoding");
      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch {
      return jsonError("Clinic API is temporarily unavailable", 502);
    }
  },
};
