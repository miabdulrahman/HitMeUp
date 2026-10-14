# Vercel Multi-Service Deployment Guidelines (Express + Vite)

## 1. Root Configuration (`vercel.json`)
When configuring a multi-service project:
- Define distinct services under `services` specifying `root` and `framework` (`"express"` and `"vite"`).
- Order top-level `rewrites` with API paths first (`/api/(.*)` to the backend service) and client catch-all last (`/(.*)` to the frontend service).
- If the frontend requires server-side bindings, declare `{ "type": "service", "service": "backend", "format": "url", "env": "BACKEND_URL" }`.

## 2. Express Backend Adaptation
- **Entry Point:** Set `"main": "server.js"` in `backend/package.json`.
- **Export App:** Ensure `module.exports = app;` is exported at the end of the entrypoint file.
- **Serverless Guard:** Wrap `app.listen()` inside `if (!process.env.VERCEL) { startServer(); }`.
- **Mongoose Connection:** Use a cached connection function in middleware:
  ```javascript
  const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGO_URI);
  };
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: "Database connection error" });
    }
  });
  ```

## 3. Frontend & API Client Architecture
- Default client API URLs to relative paths (`import.meta.env.VITE_API_URL || "/api"`).
- In `vite.config.js`, configure `server.proxy` for `/api` pointing to `http://localhost:5000` for seamless local dev.
- Maintain separate `.env` files for frontend and backend; never overwrite or expose backend secrets in frontend configs.
