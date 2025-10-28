import express from "express";
import { bot } from "./bot";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());

// Root route
app.get("/", (_, res) => res.send("✅ Telegram bot server is running!"));

// Webhook route
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
});
