import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pool } from "../db";
import { json } from "./shared";

export function registerProfileTools(server: McpServer) {
  server.registerTool(
    "get_profile",
    {
      title: "Get profile",
      description:
        "Returns Grigorios Miaritis' profile: name, current role, location, summary, " +
        "and links (personal site, GitHub, writing). Call this first to orient " +
        "yourself before using other tools.",
      inputSchema: {},
    },
    async () => {
      const { rows } = await pool.query(
        "SELECT name, title, location, summary, links FROM mcp.profile",
      );
      return json(rows[0]);
    },
  );
}
