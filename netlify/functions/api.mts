import serverless from "serverless-http";
import type { Context } from "@netlify/functions";

import app from "../../app.js";

// The Express app is a Node request handler, so it cannot be invoked directly
// with the Web Request/Response objects a Netlify Function receives. serverless-http
// bridges the two: it speaks the AWS "HTTP API v2" payload shape, which we build
// from the incoming Request and then translate back into a Response.
const toExpress = serverless(app, { provider: "aws" });

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const body = Buffer.from(await req.arrayBuffer());

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const result = await toExpress(
    {
      version: "2.0",
      rawPath: url.pathname,
      rawQueryString: url.searchParams.toString(),
      headers,
      requestContext: {
        http: {
          method: req.method,
          path: url.pathname,
          sourceIp: context.ip,
        },
      },
      body: body.length > 0 ? body.toString("base64") : "",
      isBase64Encoded: body.length > 0,
    },
    {},
  );

  const responseBody = result.isBase64Encoded
    ? Buffer.from(result.body, "base64")
    : result.body;

  const response = new Response(result.statusCode === 204 ? null : responseBody, {
    status: result.statusCode,
    headers: result.headers,
  });

  for (const cookie of result.cookies ?? []) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
};
