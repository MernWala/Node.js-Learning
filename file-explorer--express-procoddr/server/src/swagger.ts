import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs";

// Try to load a single-file OpenAPI spec (../openapi.json). If not found,
// fall back to generating the spec from JSDoc comments in routes (existing behavior).
let swaggerSpec: Record<string, any>;
try {
  const raw = fs.readFileSync(new URL("../openapi.json", import.meta.url), "utf8");
  swaggerSpec = JSON.parse(raw);
} catch (err) {
  // fallback to swagger-jsdoc (scan routes)
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "File System Explorer API",
        version: "1.0.0",
        description: "A comprehensive API for exploring, managing, and manipulating files and directories in the file system using Node.js",
        contact: { name: "API Support" }
      }
    },
    apis: ["./src/routes/*.ts"]
  };
  swaggerSpec = swaggerJSDoc(options);
}

export { swaggerUi, swaggerSpec };
