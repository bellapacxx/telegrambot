import { Telegraf } from "telegraf";
import startCommand from "./start";
import balanceCommand from "./balance";
import {depositCommand} from "./deposit";
import withdrawCommand from "./withdraw";
import playCommand from "./play";
import TelegramBot from "node-telegram-bot-api";
export const registerCommands = (bot: Telegraf<any>) => {
  console.log("Registering commands...");
  const bots = new TelegramBot(process.env.BOT_TOKEN!, { polling: true });
  startCommand(bot);
  console.log("✅ /start command registered");

  balanceCommand(bot);
  console.log("✅ /balance command registered");

  depositCommand(bots);
  console.log("✅ /deposit command registered");

  withdrawCommand(bot);
  console.log("✅ /withdraw command registered");

  playCommand(bot);
  console.log("✅ /play command registered");
};
