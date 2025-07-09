import { Handler, Route } from "./type.js";

export class Router {
  private routes: Route[] = [];

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

  // Expose all routes for mounting
  public getRoutes() {
    return this.routes;
  }
}
