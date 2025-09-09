import { Telegraf, session, Context } from "telegraf";
import dotenv from "dotenv";
import https from "https";
import { registerCommands } from "./commands";
import { logger } from "./utils/logger";

dotenv.config();

// ----------------------
// Validate BOT_TOKEN
// ----------------------
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required in .env");

// ----------------------
// HTTPS agent for stable connections (TLS 1.2+)
// ----------------------
const agent = new https.Agent({
  keepAlive: true,
  minVersion: "TLSv1.2",
  rejectUnauthorized: true,
});

// ----------------------
// Create bot instance with agent
// ----------------------
const bot = new Telegraf(BOT_TOKEN, {
  telegram: { agent, apiRoot: "https://api.telegram.org" },
});

// ----------------------
// Session middleware
// ----------------------
bot.use(session());

// ----------------------
// Logger middleware
// ----------------------
bot.use(async (ctx: Context, next) => {
  const from = ctx.from ? `${ctx.from.username || ctx.from.id}` : "unknown";
  logger.info(`[${from}] ${ctx.updateType}`);
  try {
    await next();
  } catch (err) {
    logger.error(`Error handling update: ${err}`);
  }
});

// ----------------------
// Register all commands
// ----------------------
registerCommands(bot);

// ----------------------
// Global error handling
// ----------------------
bot.catch((err, ctx) => {
  logger.error(`Bot error for updateType ${ctx.updateType}: ${err}`);
});

// ----------------------
// Launch bot with retry on network failure
// ----------------------
const launchBot = async () => {
  try {
    await bot.launch();
    logger.info("🚀 Telegram Bingo Bot started!");
  } catch (err) {
    logger.error(`Failed to launch bot: ${err}. Retrying in 5s...`);
    setTimeout(launchBot, 5000);
  }
};
launchBot();

// ----------------------
// Graceful shutdown
// ----------------------
const shutdown = (signal: string) => {
  logger.info(`Stopping bot (${signal})...`);
  bot.stop(signal);
  process.exit(0);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

// ----------------------
// Force Node to use IPv4 (Linux workaround)
// ----------------------
process.env.NODE_OPTIONS = "--dns-result-order=ipv4first";
