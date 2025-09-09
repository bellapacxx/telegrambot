import { Telegraf } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";

export default (bot: Telegraf<any>) => {
  bot.command("withdraw", async (ctx) => {
    await ctx.reply("🏦 Enter amount to withdraw:");
    ctx.session.state = "awaiting_withdraw_amount";
  });
};
