import { Telegraf } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

export default (bot: Telegraf<any>) => {
  bot.command("balance", async (ctx) => {
    try {
      // Ensure we have a numeric Telegram ID
      const telegramId = Number(ctx.from.id);
      console.log("Balance command triggered by:", ctx.from.id);
      if (!telegramId) {
        await ctx.reply("⚠️ Unable to determine your Telegram ID.", mainMenuKeyboard());
        return;
      }

      const user = await api.getUser(telegramId);

      if (!user) {
        await ctx.reply(
          "⚠️ You are not registered yet. Please use /start to register.",
          mainMenuKeyboard()
        );
        return;
      }

      // Default to 0 if balance is null/undefined
      const balance = user.balance ?? 0;

      await ctx.reply(`💰 Balance: ${balance} ETB`, mainMenuKeyboard());
    } catch (err) {
      console.error("[BALANCE COMMAND ERROR]", err);
      await ctx.reply("❌ Unable to fetch balance. Please try again later.", mainMenuKeyboard());
    }
  });
};
