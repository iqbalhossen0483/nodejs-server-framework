import fs from "fs";
import path from "path";
import { CustomResponse, ExtendedRequest, NextFunction } from "./type";

export class Middleware {
  // JSON body parser middleware
  jsonParser() {
    return (req: ExtendedRequest, res: CustomResponse, next: NextFunction) => {
      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH"
      ) {
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
          let data = "";
          req.on("data", (chunk) => {
            data += chunk;
          });
          req.on("end", () => {
            try {
              req.body = data ? JSON.parse(data) : {};
            } catch {
              res.statusCode = 400;
              res.end("Invalid JSON");
              return;
            }
            next();
          });
          return;
        }
      }
      next();
    };
  }

  // Static file server middleware
  staticServer(rootDir: string) {
    return (req: ExtendedRequest, res: CustomResponse, next: NextFunction) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      const safeSuffix = path
        .normalize(decodeURIComponent(req.url || "/"))
        .replace(/^(\.\.[/\\])+/, "");
      const filePath = path.join(rootDir, safeSuffix);
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          return next();
        }
        const stream = fs.createReadStream(filePath);
        stream.on("error", () => {
          res.statusCode = 500;
          res.end("Internal Server Error");
        });
        res.statusCode = 200;
        stream.pipe(res);
      });
    };
  }

  // Template renderer middleware
  templateRenderer(templateDir: string) {
    return (req: ExtendedRequest, res: CustomResponse, next: NextFunction) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }

      const safeSuffix = path
        .normalize(decodeURIComponent(req.url || "/"))
        .replace(/^(\.\.[/\\])+/, "");

      if (!safeSuffix.endsWith(".html")) {
        return next();
      }

      const filePath = path.join(templateDir, safeSuffix);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          return next();
        }

        fs.readFile(filePath, "utf-8", (readErr, content) => {
          if (readErr) {
            res.statusCode = 500;
            res.end("Internal Server Error");
            return;
          }

          try {
            // Simple template rendering - you can extend this
            let rendered = content;

            // You can add default data here or get it from query params
            const urlParams = new URL(
              req.url || "/",
              `http://${req.headers.host}`
            );
            const data: Record<string, any> = {};

            // Convert query params to template data
            urlParams.searchParams.forEach((value, key) => {
              data[key] = value;
            });

            // Replace template variables
            for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
                rendered = rendered.replace(regex, String(data[key]));
              }
            }

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Content-Length", Buffer.byteLength(rendered));
            res.statusCode = 200;
            res.end(rendered);
          } catch (renderErr) {
            console.error("Template rendering error:", renderErr);
            res.statusCode = 500;
            res.end("Internal Server Error");
          }
        });
      });
    };
  }

  // CORS middleware
  cors(
    options: {
      origin?: string;
      methods?: string[];
      headers?: string[];
      credentials?: boolean;
    } = {}
  ) {
    const {
      origin = "*",
      methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      headers = ["Content-Type", "Authorization"],
      credentials = false,
    } = options;

    return (req: ExtendedRequest, res: CustomResponse, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", methods.join(","));
      res.setHeader("Access-Control-Allow-Headers", headers.join(","));

      if (credentials) {
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }

      // Handle preflight OPTIONS request
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
      }

      next();
    };
  }

  // cookkie middleware
  cookieParser() {
    return (req: ExtendedRequest, _res: CustomResponse, next: NextFunction) => {
      const cookieHeader = req.headers.cookie || "";
      const cookies: Record<string, string> = {};

      cookieHeader.split(";").forEach((pair) => {
        const [key, ...val] = pair.trim().split("=");
        if (key) {
          cookies[key] = decodeURIComponent(val.join("="));
        }
      });

      req.cookies = cookies;
      next();
    };
  }
}
