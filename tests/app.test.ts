import { AppServer } from "../src/core/Server";
import request from "supertest";

let server: any;

beforeAll(() => {
  const app = new AppServer();

  app.get("/api/hello", (req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Hello, world!" }));
  });

  server = app.listen(4000);
});

afterAll((done) => {
  server.close(done);
});

describe("GET /api/hello", () => {
  it("should return 200 with a hello message", async () => {
    const res = await request(server).get("/api/hello");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Hello, world!" });
  });
});

describe("AppServer", () => {
  it("should be an instance of AppServer", () => {
    const app = new AppServer();
    expect(app).toBeInstanceOf(AppServer);
  });
});
