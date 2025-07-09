import { Middleware } from "./Middleware.js";
import { Router } from "./Router.js";
import {
  CustomResponse,
  ErrorHandler,
  Handler,
  Route,
  NextFunction,
  ExtendedRequest,
} from "./type.js";
import http, { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import path from "path";
import fs from "fs";

export class AppServer extends Middleware {
  private routes: Route[] = [];
  private middlewares: Handler[] = [];
  private errorMiddlewares: ErrorHandler[] = [];

  public use(middleware: Handler | ErrorHandler) {
    if (middleware.length === 4) {
      this.errorMiddlewares.push(middleware as ErrorHandler);
    } else {
      this.middlewares.push(middleware as Handler);
    }
  }

  public get(path: string, handler: Handler) {
    this.routes.push({ method: "GET", path, handler });
  }

  public post(path: string, handler: Handler) {
    this.routes.push({ method: "POST", path, handler });
  }

  public put(path: string, handler: Handler) {
    this.routes.push({ method: "PUT", path, handler });
  }

  public delete(path: string, handler: Handler) {
    this.routes.push({ method: "DELETE", path, handler });
  }

  public patch(path: string, handler: Handler) {
    this.routes.push({ method: "PATCH", path, handler });
  }

  private enhanceResponse(res: ServerResponse): CustomResponse {
    const customRes = res as CustomResponse;

    if (typeof customRes.json !== "function") {
      customRes.json = (data: any) => {
        if (!customRes.writableEnded) {
          customRes.setHeader("Content-Type", "application/json");
          customRes.statusCode = customRes.statusCode || 200;
          customRes.end(JSON.stringify(data));
        }
      };
    }
    if (typeof customRes.send !== "function") {
      customRes.send = (data: any) => {
        if (!customRes.writableEnded) {
          customRes.setHeader("Content-Type", "text/plain");
          customRes.statusCode = customRes.statusCode || 200;
          if (typeof data === "object") {
            customRes.json(data);
          } else {
            customRes.end(data);
          }
        }
      };
    }

    if (typeof customRes.redirect !== "function") {
      customRes.redirect = (url: string) => {
        if (!customRes.writableEnded) {
          customRes.statusCode = 302;
          customRes.setHeader("Location", url);
          customRes.end();
        }
      };
    }

    if (typeof customRes.status !== "function") {
      customRes.status = (statusCode: number) => {
        if (!customRes.writableEnded) {
          customRes.statusCode = statusCode;
        }
        return customRes;
      };
    }

    if (typeof customRes.render !== "function") {
      customRes.render = (view: string, data: Record<string, any> = {}) => {
        const filePath = path.join(process.cwd(), "templates", view);

        fs.readFile(filePath, "utf-8", (err, content) => {
          if (err) {
            customRes.statusCode = 500;
            return customRes.end("Template not found");
          }

          let rendered = content;
          for (const key in data) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
            rendered = rendered.replace(regex, String(data[key]));
          }

          customRes.setHeader("Content-Type", "text/html; charset=utf-8");
          customRes.statusCode = 200;
          customRes.end(rendered);
        });
      };
    }

    return customRes;
  }

  private runMiddlewares(
    req: IncomingMessage,
    res: CustomResponse,
    handlers: Handler[],
    done: () => void
  ) {
    let i = 0;

    const next: NextFunction = (err?: any) => {
      if (err) return this.runErrorMiddlewares(err, req, res);

      const handler = handlers[i++];
      if (!handler) return done();

      try {
        handler(req, res, next);
      } catch (error) {
        next(error);
      }
    };

    next();
  }

  private runErrorMiddlewares(
    err: any,
    req: IncomingMessage,
    res: CustomResponse
  ) {
    let i = 0;

    const next: NextFunction = (error?: any) => {
      const handler = this.errorMiddlewares[i++];
      if (!handler) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : typeof error === "object" && error?.message
            ? String(error.message)
            : "Internal Server Error";

        res.statusCode = 500;
        console.error(error);
        res.json({ error: message });
        return;
      }

      try {
        handler(error || err, req, res, next);
      } catch (e) {
        next(e);
      }
    };

    next(err);
  }

  public useRouter(pathPrefix: string, router: Router) {
    const routerRoutes = router.getRoutes();

    // Prefix all router routes and add them to main routes
    routerRoutes.forEach((route) => {
      this.routes.push({
        method: route.method,
        path: pathPrefix + route.path,
        handler: route.handler,
      });
    });
  }

  public listen(port: number, callback?: () => void) {
    const server = http.createServer((req, res) => {
      const customRes = this.enhanceResponse(res);
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      const method = req.method?.toUpperCase() || "GET";
      const pathname = url.pathname;

      // Cast req to ExtendedRequest for extra properties
      const reqExt = req as ExtendedRequest;

      // Parse query parameters
      reqExt.query = {};
      url.searchParams.forEach((value, key) => {
        reqExt.query![key] = value;
      });

      // Middleware pipeline
      this.runMiddlewares(reqExt, customRes, this.middlewares, () => {
        // Dynamic route matching
        const matchedRoute = this.routes.find((route) => {
          if (route.method !== method) return false;

          const routeParts = route.path.split("/").filter(Boolean);
          const pathParts = pathname.split("/").filter(Boolean);

          if (routeParts.length !== pathParts.length) return false;

          return routeParts.every(
            (part, i) => part.startsWith(":") || part === pathParts[i]
          );
        });

        if (matchedRoute) {
          // Extract route params
          const routeParts = matchedRoute.path.split("/").filter(Boolean);
          const pathParts = pathname.split("/").filter(Boolean);

          reqExt.params = {};
          routeParts.forEach((part, i) => {
            if (part.startsWith(":")) {
              reqExt.params![part.slice(1)] = pathParts[i];
            }
          });

          this.runMiddlewares(reqExt, customRes, [matchedRoute.handler], () => {
            if (!customRes.writableEnded) {
              customRes.statusCode = 204;
              customRes.end();
            }
          });
        } else {
          customRes.statusCode = 404;
          customRes.end(`Cannot ${method} ${pathname}`);
        }
      });
    });

    return server.listen(port, callback);
  }
}
