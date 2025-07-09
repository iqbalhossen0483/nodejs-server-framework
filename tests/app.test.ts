import { AppServer } from "../src/core/Server";
import { multerAnyMiddleware } from "../src/plugins/multer";
import { userRouter } from "../src/routes/job.route";
import path from "path";
import request from "supertest";

let server: any;

beforeAll(() => {
  const app = new AppServer();

  app.use(app.cookieParser());
  app.use(app.jsonParser());
  app.use(app.staticServer(path.join(process.cwd(), "public")));
  app.use(app.templateRenderer(path.join(process.cwd(), "templates")));
  app.use(multerAnyMiddleware());

  app.useRouter("/api/job", userRouter);

  app.get("/api/hello", (req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Hello, world!" }));
  });

  app.get("/api/fail", (req, res, next) => {
    next({ message: "This is a test error" });
  });

  app.get("/api/show-cookies", (req, res) => {
    res.json({ cookies: req.cookies });
  });

  app.get("/api/user/:id", (req, res) => {
    res.json({
      userId: req.params?.id,
      q: req.query?.search,
    });
  });

  app.post("/api/user", (req, res) => {
    res.status(201).json(req.body);
  });

  app.post("/api/user/upload", (req, res) => {
    res.statusCode = 201;
    res.json({
      uploaded: true,
      body: req.body,
      fileCount: req.files?.length || 0,
    });
  });

  app.get("/pages/user_page", (req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(`<html><body><h1>User Page</h1></body></html>`);
  });

  app.use((err, req, res, _next) => {
    res.statusCode = 500;
    res.json({ error: err.message });
  });

  server = app.listen(4000);
});

afterAll((done) => {
  server.close(done);
});

describe("AppServer API Tests", () => {
  it("GET /api/hello", async () => {
    const res = await request(server).get("/api/hello");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Hello, world!" });
  });

  it("GET /api/fail should return error", async () => {
    const res = await request(server).get("/api/fail");
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "This is a test error");
  });

  it("GET /api/show-cookies should return cookies", async () => {
    const res = await request(server)
      .get("/api/show-cookies")
      .set("Cookie", "foo=bar");
    expect(res.statusCode).toBe(200);
    expect(res.body.cookies).toHaveProperty("foo", "bar");
  });

  it("GET /api/user/:id with query", async () => {
    const res = await request(server).get("/api/user/123?q=engineer");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ userId: "123", q: "engineer" });
  });

  it("POST /api/user", async () => {
    const payload = { name: "Iqbal", role: "admin" };
    const res = await request(server).post("/api/user").send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(payload);
  });

  it("POST /api/user/upload", async () => {
    const res = await request(server)
      .post("/api/user/upload")
      .field("username", "Iqbal")
      .attach("avatar", path.join(__dirname, "../public/logo.png"));

    expect(res.statusCode).toBe(201);
    expect(res.body.uploaded).toBe(true);
    expect(res.body.fileCount).toBe(1);
  });

  it("GET /pages/user_page", async () => {
    const res = await request(server).get("/pages/user_page");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("User Page");
  });

  it("GET /api/job/all (router group)", async () => {
    const res = await request(server).get("/api/job/all");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("All job list");
  });
});
