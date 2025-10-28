import express from "express";
import { bot } from "./bot"; // ← this imports your TelegramBot instance
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN!;
const app = express();

app.use(express.json());

// Root route just to confirm server is live
app.get("/", (_, res) => res.send("✅ Telegram bot server is running!"));

// Webhook route — Telegram will send updates here
app.post(`/${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🌐 Dummy server running on port ${PORT}`);
});
