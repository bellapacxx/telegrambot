import TelegramBot, { Message } from "node-telegram-bot-api";
import dotenv from "dotenv";
import { registerCommands } from "./commands";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required in .env");

// Create bot instance with polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Simple session store
const userData: Record<number, any> = {};

// Logger middleware
bot.on("message", (msg: Message) => {
  const from = msg.from ? `${msg.from.username || msg.from.id}` : "unknown";
  console.log(`[MESSAGE] ${from} -> ${msg.text}`);
});

// Register all commands
registerCommands(bot);

// Global error handling
bot.on("polling_error", (err) => {
  console.error("Polling error:", err);
});

bot.on("webhook_error", (err) => {
  console.error("Webhook error:", err);
});

console.log("🚀 Bot started");

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`Stopping bot (${signal})...`);
  bot.stopPolling();
  process.exit(0);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

export { bot, userData };
