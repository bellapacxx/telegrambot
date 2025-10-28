import TelegramBot, { Message } from "node-telegram-bot-api";
import dotenv from "dotenv";
import { registerCommands } from "./commands";
import { registerBotMenu } from "./utils/menu";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g. https://telegrambot-xxxxx.leapcell.dev
const NODE_ENV = process.env.NODE_ENV || "development";

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required in .env");

// Use a temporary variable to hold the instance
let botInstance: TelegramBot;

// 🧠 Hybrid mode — webhook in production, polling locally
if (NODE_ENV === "production" && WEBHOOK_URL) {
  botInstance = new TelegramBot(BOT_TOKEN, { webHook: true });

  const webhookEndpoint = `${WEBHOOK_URL}/webhook`;

  botInstance
    .setWebHook(webhookEndpoint, {
      allowed_updates: ["message", "callback_query", "chat_member"],
    })
    .then(async () => {
      console.log(`✅ Webhook set to: ${webhookEndpoint}`);
      const info = await botInstance.getWebHookInfo();
      console.log("🔗 Current webhook info:", info);
    })
    .catch((err) => console.error("❌ Failed to set webhook:", err));
} else {
  botInstance = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log("🚀 Bot running in polling mode (local dev)");
}

// ✅ assign the final bot after it’s definitely initialized
const bot = botInstance;

// 🧠 Simple in-memory session store
const userData: Record<number, any> = {};

// 🪵 Logger middleware
bot.on("message", (msg: Message) => {
  const from = msg.from ? `${msg.from.username || msg.from.id}` : "unknown";
  console.log(`[MESSAGE] ${from} -> ${msg.text}`);
});

// 🧩 Register commands and menu
registerBotMenu(bot);
registerCommands(bot);

// ⚠️ Error handling
bot.on("polling_error", (err) => console.error("Polling error:", err));
bot.on("webhook_error", (err) => console.error("Webhook error:", err));

console.log("✅ Bot initialized");

export { bot, userData };
