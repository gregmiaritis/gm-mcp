import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pool } from "../db";
import { json, notFound } from "./shared";

export function registerEvidenceTools(server: McpServer) {
  server.registerTool(
    "list_evidence",
    {
      title: "List evidence",
      description:
        "Lists evidence backing specific claims (e.g. metrics, artifacts, links). " +
        "Returns id, claim, tags, and the role/project it's tied to. Optionally " +
        "filter to the evidence for one role/project. Use get_evidence with an id " +
        "for full detail.",
      inputSchema: {
        source_type: z
          .enum(["experience", "project"])
          .optional()
          .describe("Filter to evidence tied to roles or projects."),
        source_id: z
          .string()
          .optional()
          .describe(
            "Filter to evidence for one role/project id, e.g. 'connexai' or 'silo'.",
          ),
      },
    },
    async ({ source_type, source_id }) => {
      const conditions: string[] = [];
      const params: string[] = [];
      if (source_type) {
        params.push(source_type);
        conditions.push(`source_type = $${params.length}`);
      }
      if (source_id) {
        params.push(source_id);
        conditions.push(`source_id = $${params.length}`);
      }
      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const { rows } = await pool.query(
        `SELECT id, claim, tags, source_type, source_id
         FROM mcp.evidence ${where} ORDER BY id`,
        params,
      );
      if (rows.length === 0 && conditions.length > 0)
        return json({
          results: [],
          hint: "No evidence matches that filter. Call list_evidence with no arguments to see all source_type/source_id values.",
        });
      return json({ results: rows });
    },
  );

  server.registerTool(
    "get_evidence",
    {
      title: "Get evidence detail",
      description:
        "Returns full detail for one piece of evidence: the claim, supporting " +
        "detail, tags, and the role/project it's tied to. Get valid ids from " +
        "list_evidence.",
      inputSchema: {
        id: z
          .union([z.number(), z.string()])
          .pipe(z.coerce.number().int())
          .describe(
            "Evidence id from list_evidence (number or numeric string).",
          ),
      },
    },
    async ({ id }) => {
      const { rows } = await pool.query(
        `SELECT id, claim, detail, tags, source_type, source_id
         FROM mcp.evidence WHERE id = $1`,
        [id],
      );
      if (!rows[0])
        return notFound(
          "evidence",
          String(id),
          "Call list_evidence for valid ids.",
        );
      return json(rows[0]);
    },
  );
}
