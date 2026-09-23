import serverless from "serverless-http";
import type { Context } from "@netlify/functions";

import app from "../../app.js";

// The Express app is a Node request handler, so it cannot be invoked directly
// with the Web Request/Response objects a Netlify Function receives. serverless-http
// bridges the two: it speaks the AWS "HTTP API v2" payload shape, which we build
// from the incoming Request and then translate back into a Response.
const toExpress = serverless(app, { provider: "aws" });

export default async (req: Request, context: Context) => {
  try {
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
            sourceIp: context?.ip,
          },
        },
        body: body.length > 0 ? body.toString("base64") : "",
        isBase64Encoded: body.length > 0,
      },
      {},
    );

    const isNullBody =
      req.method === "HEAD" ||
      result.statusCode === 204 ||
      result.statusCode === 205 ||
      result.statusCode === 304 ||
      (result.statusCode >= 100 && result.statusCode < 200);

    const responseBody = isNullBody
      ? null
      : result.isBase64Encoded
        ? Buffer.from(result.body, "base64")
        : (result.body ?? "");

    const response = new Response(responseBody, {
      status: result.statusCode || 200,
      headers: result.headers,
    });

    for (const cookie of result.cookies ?? []) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (error) {
    console.error("Function invocation error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
