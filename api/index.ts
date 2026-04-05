import express from "express";
import path from "path";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV });
});

// Note: In production on Vercel, static files are served by Vercel's edge network,
// not by this Express app. This server is only for /api/* routes.
// However, for local development, we still need the Vite middleware.

if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

// For local development, we listen on a port.
// On Vercel, we export the app.
if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
