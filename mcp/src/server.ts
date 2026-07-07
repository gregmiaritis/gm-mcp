import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { PostHog } from "posthog-node";
import { instrument } from "@posthog/mcp";
import { registerTools } from "./tools";

const PORT = Number(process.env.PORT ?? 3000);
const TOKEN = process.env.MCP_TOKEN;

if (!TOKEN) {
  console.error("MCP_TOKEN is required");
  process.exit(1);
}

const posthog = process.env.POSTHOG_PROJECT_TOKEN
  ? new PostHog(process.env.POSTHOG_PROJECT_TOKEN, {
      host: process.env.POSTHOG_HOST,
    })
  : undefined;

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "grigorios-miaritis-cv", version: "1.0.0" },
    {
      instructions:
        "This MCP server lets you interrogate Grigorios (Greg) Miaritis as a candidate. " +
        "Start with get_profile. Use search for anything else. get_pointless_fact " +
        "is exactly what it sounds like.",
    },
  );
  registerTools(server);

  if (posthog) {
    instrument(server.server, posthog);
  }

  return server;
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));

app.use(
  "/mcp",
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
  }),
);
app.use("/mcp", (req, res, next) => {
  const queryToken = req.query.token;
  if (queryToken !== TOKEN) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message:
          "Unauthorized. Use the token from the cover letter: ?token=<token> to the URL.",
      },
      id: null,
    });
    return;
  }
  next();
});

app.post("/mcp", async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_req, res) => res.status(405).end());
app.delete("/mcp", (_req, res) => res.status(405).end());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`MCP server listening on :${PORT}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    await posthog?.shutdown();
    process.exit(0);
  });
}
