import { Telegraf } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

export default (bot: Telegraf<any>) => {
  bot.start(async (ctx) => {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username;

    try {
      await api.registerUser({ telegramId, username });
      await ctx.reply(`👋 Welcome ${username || "Player"}!`, mainMenuKeyboard());
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Failed to register. Try again later.");
    }
  });
};
