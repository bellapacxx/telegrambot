import { Telegraf, Context } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

export default (bot: Telegraf<Context>) => {
  // ----------------------
  // Shared balance handler
  // ----------------------
  const handleBalance = async (ctx: Context) => {
    try {
      const telegramId = Number(ctx.from?.id);
      console.log("Balance triggered by:", telegramId);

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

      const balance = user.balance ?? 0;
      await ctx.reply(`💰 Balance: ${balance} ETB`, mainMenuKeyboard());
    } catch (err) {
      console.error("[BALANCE HANDLER ERROR]", err);
      await ctx.reply("❌ Unable to fetch balance. Please try again later.", mainMenuKeyboard());
    }
  };

  // ----------------------
  // /balance command
  // ----------------------
  bot.command("balance", handleBalance);

  // ----------------------
  // Inline button callback
  // ----------------------
  bot.action("balance", async (ctx) => {
    await handleBalance(ctx);
    // Optionally answer the callback to remove the "loading…" state
    await ctx.answerCbQuery();
  });
};
