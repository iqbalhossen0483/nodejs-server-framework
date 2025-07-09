# 🚀 Node.js Custom Server Framework

A powerful and extendable Node.js server framework written in **TypeScript** — with built-in support for routing, middleware, CORS, cookie parsing, static and HTML serving, JSON body parsing, file uploads, and more. Think of it as a lightweight version of Express.js to learn **OOP architecture**, middleware flow, and custom server internals.

---

## ✨ Features

- ✅ TypeScript + ESLint Configured
- ✅ Custom Routing & Route Groups
- ✅ Middleware System (like Express)
- ✅ JSON Body Parser
- ✅ Static File Serving
- ✅ HTML Template Rendering
- ✅ File Upload with `multer`
- ✅ CORS Support
- ✅ Cookie Parser
- ✅ Error Handling Middleware
- ✅ Router Class for Grouped Routes

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Server in Dev Mode

```bash
npm run dev
```

### 3. Build the Project

```bash
npm run build
```

### 4. Run Tests

```bash
npm test
```

---

## 📦 Example Usage

### Define Routes

```ts
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello, world!" });
});

app.post("/api/user", (req, res) => {
  res.json(req.body);
});
```

### Upload Files (with `multer`)

```ts
app.post("/api/upload", (req, res) => {
  console.log(req.body, req.files);
  res.json({ uploaded: true });
});
```

### Render HTML Templates

```ts
app.get("/api/user_page", (req, res) => {
  res.render("user.html", {
    title: "User Page",
    user: { name: "John Doe", age: 30 },
  });
});
```

### Access Cookies

```ts
app.get("/api/show-cookies", (req, res) => {
  res.json({ cookies: req.cookies });
});
```

---

## 🔐 CORS Example

```ts
app.use(
  app.cors({
    origin: "*",
    methods: ["GET", "POST"],
    headers: ["Content-Type", "Authorization"],
  })
);
```

---

## 🔍 Learning Goals

- Master **Object-Oriented Programming (OOP)** in Node.js
- Learn how frameworks like **Express.js** work internally
- Practice TypeScript, ESLint, router building, middleware chaining
- Understand core Node.js modules like `http`, `fs`, `url`, `stream`

---

## 👨‍💻 Author

**Md Iqbal Hossen**
Custom server builder, Node.js enthusiast, backend engineer.

---

## 📃 License

[ISC](LICENSE)

```
Let me know if you want me to auto-generate this into a file, or if you'd like badges (build passing, license, etc.) included.
```
