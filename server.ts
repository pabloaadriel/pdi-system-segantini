import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import cors from "cors";

// Initialize Resend with API Key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // API Route for Invites
  app.post("/api/invite", async (req, res) => {
    const { email, assignedName, role, appUrl } = req.body;

    if (!email || !assignedName || !role) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    try {
      // Send Email via Resend
      const { data, error } = await resend.emails.send({
        from: "Segantini PDI <onboarding@resend.dev>", // Replace with verified domain if available
        to: [email],
        subject: "Convite: PDI Segantini Consultoria - SeaHub",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f97316; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: -1px;">Segantini Consultoria</h1>
              <p style="color: #64748b; font-size: 14px; font-weight: bold; margin-top: 4px;">PDI SYSTEM - SEAHUB</p>
            </div>
            
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">Olá, ${assignedName}!</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
              Você foi convidado para participar do <strong>Programa de Desenvolvimento Individual (PDI)</strong> da Segantini Consultoria para o <strong>SeaHub</strong>.
            </p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
              <p style="margin: 0; color: #64748b; font-size: 13px;">Seu nível de acesso:</p>
              <p style="margin: 4px 0 0 0; color: #0f172a; font-weight: bold; text-transform: uppercase;">${role}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${appUrl}" style="display: inline-block; background: #f97316; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Acessar meu PDI
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0 20px 0;" />
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
              Este é um e-mail automático enviado pelo sistema de PDI da Segantini Consultoria.<br />
              Se você não esperava este convite, por favor desconsidere.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: "Erro ao enviar e-mail" });
      }

      res.json({ success: true, data });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
