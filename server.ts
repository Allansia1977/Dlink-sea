import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.post("/api/send-email", async (req, res) => {
    try {
      const { email, pptxBase64, filename } = req.body;

      if (!email || !pptxBase64) {
        return res.status(400).json({ error: "Missing email or pptxBase64" });
      }

      // Check if SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return res.status(500).json({ 
          error: "SMTP is not configured on the server. Please configure SMTP settings in .env" 
        });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Convert base64 to buffer
      // pptxBase64 comes as a base64 string (might have data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64, prefix)
      const base64Data = pptxBase64.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Retail Store Audit Photos",
        text: "Please find the attached PowerPoint presentation containing the retail store audit photos.",
        attachments: [
          {
            filename: filename || "Store_Audit.pptx",
            content: buffer,
            contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
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
