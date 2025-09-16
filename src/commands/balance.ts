import { Telegraf } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

export default (bot: Telegraf<any>) => {
  bot.command("balance", async (ctx) => {
    try {
      const user = await api.getUser(ctx.from.id);

      if (!user) {
        await ctx.reply(
          "⚠️ You are not registered yet. Please use /start to register.",
          mainMenuKeyboard()
        );
        return;
      }

      await ctx.reply(`💰 Balance: ${user.balance} ETB`, mainMenuKeyboard());
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Unable to fetch balance.");
    }
  });
};
