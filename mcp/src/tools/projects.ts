import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pool } from "../db";
import { json, notFound } from "./shared";

export function registerProjectTools(server: McpServer) {
  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description:
        "Lists side projects and major independent builds (e.g. Silo — an internal " +
        "platform with its own MCP server). Use get_project for detail.",
      inputSchema: {},
    },
    async () => {
      const { rows } = await pool.query(
        "SELECT id, name, one_liner, jd_tags FROM mcp.projects ORDER BY name",
      );
      return json(rows);
    },
  );

  server.registerTool(
    "get_project",
    {
      title: "Get project detail",
      description:
        "Returns full detail for one project: description, highlights, tech stack, " +
        "and links. Get valid ids from list_projects.",
      inputSchema: {
        id: z.string().describe("Project id from list_projects, e.g. 'silo'"),
      },
    },
    async ({ id }) => {
      const { rows } = await pool.query(
        `SELECT id, name, one_liner, detail, highlights, tech, jd_tags, links
         FROM mcp.projects WHERE id = $1`,
        [id],
      );
      if (!rows[0])
        return notFound("project", id, "Call list_projects for valid ids.");
      return json(rows[0]);
    },
  );
}
