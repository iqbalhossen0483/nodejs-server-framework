import { AppServer } from "./core/Server.js";
import path from "path";
import { multerAnyMiddleware } from "./plugins/multer.js";
import { logRequest } from "./utils/logger.js";
import { userRouter } from "./routes/job.route.js";

const app = new AppServer();

app.use(logRequest());
app.use(app.cookieParser());
app.use(app.jsonParser());
app.use(app.staticServer(path.join(process.cwd(), "public")));
app.use(app.templateRenderer(path.join(process.cwd(), "templates")));
app.use(multerAnyMiddleware());
app.use(
  app.cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.useRouter("/api/job", userRouter);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello, world!" });
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
  const files = req.files;
  console.log({ files, body: req.body });
  res.statusCode = 201;
  res.json(req.body);
});

app.get("/pages/user_page", (req, res) => {
  res.render("user.html", {
    title: "User Page",
    name: "John Doe",
    age: 30,
  });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.json({ error: err.message });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
