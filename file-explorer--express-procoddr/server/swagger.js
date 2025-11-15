import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "File System Explorer API",
      version: "1.0.0",
      description: "A comprehensive API for exploring, managing, and manipulating files and directories in the file system using Node.js",
      contact: {
        name: "API Support"
      }
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server"
      },
    ],
    components: {
      schemas: {
        FileItem: {
          type: "object",
          description: "Represents a file or directory found in the filesystem",
          properties: {
            type: {
              type: "string",
              enum: ["file", "dir"],
              example: "file"
            },
            file: {
              type: "string",
              example: "example.txt"
            },
            path: {
              type: "string",
              example: "documents/example.txt"
            }
          }
        },
        DirectoryItem: {
          type: "object",
          description: "Represents an item inside a directory",
          properties: {
            type: {
              type: "string",
              enum: ["file", "dir"]
            },
            file: {
              type: "string"
            },
            path: {
              type: "string"
            }
          }
        },
        CreateDirInput: {
          type: "object",
          description: "JSON body for directory creation",
          properties: {
            name: {
              type: "string",
              example: "new-folder"
            },
            target: {
              type: "string",
              example: "documents"
            }
          },
          required: ["name", "target"]
        }
      }
    }
  },
  apis: ["./routes/*.js"], // Scan routes for docs
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };
