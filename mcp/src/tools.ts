import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerProfileTools } from "./tools/profile";
import { registerExperienceTools } from "./tools/experience";
import { registerProjectTools } from "./tools/projects";
import { registerSearchTools } from "./tools/search";
import { registerPointlessFactTools } from "./tools/pointless-fact";

export function registerTools(server: McpServer) {
  registerProfileTools(server);
  registerExperienceTools(server);
  registerProjectTools(server);
  registerSearchTools(server);
  registerPointlessFactTools(server);
}
