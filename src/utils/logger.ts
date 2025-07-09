import { IncomingMessage, ServerResponse } from "http";
import { NextFunction } from "../core/type";

export function logRequest() {
  return (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const method = req.method || "UNKNOWN";
      const url = req.url || "/";
      const status = res.statusCode;
      console.log(`[${method}] ${url} - ${status} - ${duration}ms`);
    });

    next();
  };
}
