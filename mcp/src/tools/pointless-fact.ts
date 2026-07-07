import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pool } from "../db";
import { json } from "./shared";

export function registerPointlessFactTools(server: McpServer) {
  server.registerTool(
    "get_pointless_fact",
    {
      title: "Get a pointless fact",
      description:
        "Returns one absurd-but-true fact about .less (pointless-code), Grigorios' open source " +
        "brand of deliberately worthless Docker projects (including an escape room " +
        "called CortexForge). Worth checking.",
      inputSchema: {},
    },
    async () => {
      const { rows } = await pool.query(
        "SELECT fact FROM mcp.pointless_facts ORDER BY random() LIMIT 1",
      );
      return json(
        rows[0] ?? {
          fact: "The facts table is empty, which is itself quite .less.",
        },
      );
    },
  );
}
