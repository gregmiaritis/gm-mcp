import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pool } from "../db";
import { json, notFound } from "./shared";

export function registerExperienceTools(server: McpServer) {
  server.registerTool(
    "list_experience",
    {
      title: "List work experience",
      description:
        "Lists all professional roles. Returns id, " +
        "company, title, dates, and a one-line summary per role. Use get_role with " +
        "an id for full details.",
      inputSchema: {},
    },
    async () => {
      const { rows } = await pool.query(
        `SELECT id, company, title, location,
                to_char(start_date, 'Mon YYYY') AS start,
                COALESCE(to_char(end_date, 'Mon YYYY'), 'Present') AS "end",
                one_liner
         FROM mcp.experience ORDER BY start_date DESC`,
      );
      return json(rows);
    },
  );

  server.registerTool(
    "get_role",
    {
      title: "Get role detail",
      description:
        "Returns full detail for one role: description, key achievements, and " +
        "technologies used. Get valid ids from list_experience.",
      inputSchema: {
        id: z
          .string()
          .describe("Role id from list_experience, e.g. 'connexai'"),
      },
    },
    async ({ id }) => {
      const { rows } = await pool.query(
        `SELECT id, company, title, location,
                to_char(start_date, 'Mon YYYY') AS start,
                COALESCE(to_char(end_date, 'Mon YYYY'), 'Present') AS "end",
                detail, achievements, tech
         FROM mcp.experience WHERE id = $1`,
        [id],
      );
      if (!rows[0])
        return notFound("role", id, "Call list_experience for valid ids.");
      return json(rows[0]);
    },
  );
}
