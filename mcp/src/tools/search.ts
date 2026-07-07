import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pool } from "../db";
import { json } from "./shared";

export function registerSearchTools(server: McpServer) {
  server.registerTool(
    "search",
    {
      title: "Search everything",
      description:
        "Full-text search across experience and projects. Use it for anything the " +
        "other tools don't answer directly, e.g. 'government APIs' or 'CI/CD'.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "Free-text query, e.g. 'error tracking' or 'ERP integration'",
          ),
      },
    },
    async ({ query }) => {
      if (query.trim().length < 2)
        return json({
          results: [],
          hint: "Search needs at least 2 characters.",
        });
      const { rows } = await pool.query("SELECT * FROM mcp.search_all($1)", [
        query,
      ]);
      if (rows.length === 0)
        return json({
          results: [],
          hint: "No matches. Try broader terms.",
        });
      return json({ results: rows });
    },
  );
}
