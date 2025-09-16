import { Telegraf } from "telegraf";
import startCommand from "./start";
import balanceCommand from "./balance";
import depositCommand from "./deposit";
import withdrawCommand from "./withdraw";
import playCommand from "./play";

export const registerCommands = (bot: Telegraf<any>) => {
  console.log("Registering commands...");

  startCommand(bot);
  console.log("✅ /start command registered");

  balanceCommand(bot);
  console.log("✅ /balance command registered");

  depositCommand(bot);
  console.log("✅ /deposit command registered");

  withdrawCommand(bot);
  console.log("✅ /withdraw command registered");

  playCommand(bot);
  console.log("✅ /play command registered");
};
