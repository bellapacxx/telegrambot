import TelegramBot, { Message } from "node-telegram-bot-api";
import dotenv from "dotenv";
import { registerCommands } from "./commands";
import { registerBotMenu } from "./utils/menu";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g., "https://your-app.onrender.com/webhook"
const NODE_ENV = process.env.NODE_ENV || "development";

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required in .env");

let bot: TelegramBot;

// 🧠 Hybrid mode — webhook in production, polling locally
if (NODE_ENV === "production" && WEBHOOK_URL) {
  bot = new TelegramBot(BOT_TOKEN, { webHook: true });

  const webhookEndpoint = `${WEBHOOK_URL}/${BOT_TOKEN}`;
  bot
    .setWebHook(webhookEndpoint)
    .then(() => console.log(`✅ Webhook set to: ${webhookEndpoint}`))
    .catch((err) => console.error("❌ Failed to set webhook:", err));
} else {
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log("🚀 Bot running in polling mode (local dev)");
}

// Simple session store
const userData: Record<number, any> = {};

// Logger middleware
bot.on("message", (msg: Message) => {
  const from = msg.from ? `${msg.from.username || msg.from.id}` : "unknown";
  console.log(`[MESSAGE] ${from} -> ${msg.text}`);
});

// Register commands and menu
registerBotMenu(bot);
registerCommands(bot);

// Error handling
bot.on("polling_error", (err) => console.error("Polling error:", err));
bot.on("webhook_error", (err) => console.error("Webhook error:", err));

console.log("✅ Bot initialized");

export { bot, userData };
