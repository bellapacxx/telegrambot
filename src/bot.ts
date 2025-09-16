import { Telegraf, session, Context } from "telegraf";
import dotenv from "dotenv";
import { registerCommands } from "./commands";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required in .env");

// Create bot instance
const bot = new Telegraf(BOT_TOKEN);

// Session middleware
bot.use(session());

// Logger middleware for debugging
bot.use(async (ctx: Context, next) => {
  const from = ctx.from ? `${ctx.from.username || ctx.from.id}` : "unknown";
  console.log(`[UPDATE] ${from} -> ${ctx.updateType}`);
  await next();
});

// Register all commands
registerCommands(bot);

// Fallback listener (debugging)
bot.on("message", (ctx) => {
  console.log("Message received:", ctx.message, "from", ctx.from?.id);
});

// Global error handling
bot.catch((err, ctx) => {
  console.error("Bot error:", err, ctx.updateType);
});

// Launch bot
bot.launch().then(() => console.log("🚀 Bot started"));

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`Stopping bot (${signal})...`);
  bot.stop(signal);
  process.exit(0);
};
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
