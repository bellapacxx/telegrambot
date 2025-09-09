import { Telegraf } from "telegraf";
import startCommand from "./start";
import balanceCommand from "./balance";
import depositCommand from "./deposit";
import withdrawCommand from "./withdraw";
import playCommand from "./play";

export const registerCommands = (bot: Telegraf<any>) => {
  startCommand(bot);
  balanceCommand(bot);
  depositCommand(bot);
  withdrawCommand(bot);
  playCommand(bot);
};
