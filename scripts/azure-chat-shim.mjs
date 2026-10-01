import { createServer } from "node:http";
import { Readable } from "node:stream";

const port = Number(process.env.PORT || 8080);
const upstream = normalize(process.env.AZURE_UPSTREAM || "");
if (!upstream) {
  console.error("AZURE_UPSTREAM is required");
  process.exit(1);
}

// Foundry chat models reject max_tokens. The server's OpenAI-compatible client sends it.
function rewrite(body, contentType) {
  if (!body.length || !contentType.includes("json")) return body;
  try {
    const json = JSON.parse(body.toString("utf8"));
    if (!json || typeof json !== "object" || Array.isArray(json)) return body;
    if (json.max_tokens != null && json.max_completion_tokens == null) {
      json.max_completion_tokens = json.max_tokens;
      delete json.max_tokens;
      return Buffer.from(JSON.stringify(json));
    }
  } catch {
    return body;
  }
  return body;
}

function normalize(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return "";
  }
  let path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/responses")) path = path.slice(0, -"/responses".length);
  url.pathname = path || "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

const hop = new Set(["host", "connection", "content-length", "transfer-encoding"]);

createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = rewrite(Buffer.concat(chunks), String(req.headers["content-type"] || ""));
    const incoming = new URL(req.url || "/", "http://shim");
    const suffix = incoming.pathname.replace(/^\/v1(?=\/|$)/, "") + incoming.search;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null || hop.has(key.toLowerCase())) continue;
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
    const upstreamResponse = await fetch(upstream + suffix, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });
    const responseHeaders = {};
    upstreamResponse.headers.forEach((value, key) => {
      if (!hop.has(key)) responseHeaders[key] = value;
    });
    res.writeHead(upstreamResponse.status, responseHeaders);
    if (!upstreamResponse.body || req.method === "HEAD") {
      res.end();
      return;
    }
    Readable.fromWeb(upstreamResponse.body).pipe(res);
  } catch (error) {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(error instanceof Error ? error.message : String(error));
  }
}).listen(port, "0.0.0.0");
