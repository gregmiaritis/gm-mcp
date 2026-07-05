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
        "Full-text search across all experience, projects, and evidence. Use this " +
        "for any question the structured tools don't answer directly, e.g. " +
        "'government APIs', 'Greek character encoding', 'CI/CD'. Returns ranked " +
        "matches with highlighted snippets and pointers (kind + id) you can follow " +
        "up with get_role or get_project.",
      inputSchema: {
        query: z
          .string()
          .min(2)
          .describe(
            "Free-text query, e.g. 'error tracking' or 'ERP integration'",
          ),
      },
    },
    async ({ query }) => {
      const { rows } = await pool.query("SELECT * FROM mcp.search_all($1)", [
        query,
      ]);
      if (rows.length === 0)
        return json({
          results: [],
          hint: "No matches. Try broader terms, or ask via match_to_requirement.",
        });
      return json({ results: rows });
    },
  );
}
