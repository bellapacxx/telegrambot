import { Telegraf, Markup, Context } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

export default (bot: Telegraf<Context>) => {
  // /start handler
  bot.start(async (ctx) => {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || "Player";

    if (!telegramId) {
      return ctx.reply("❌ Cannot identify you. Please try again.");
    }

    try {
      // Check if user exists
      const exists = await api.checkUser(telegramId);
      if (exists) {
        await ctx.reply(`👋 Welcome back ${username}!`, mainMenuKeyboard());
        return;
      }

      // Ask for phone number
      await ctx.reply(
        "📱 Please share your phone number to complete registration:",
        Markup.keyboard([
          Markup.button.contactRequest("📲 Share Phone Number")
        ])
          .resize()
          .oneTime()
      );
    } catch (err) {
      console.error("❌ Error checking user:", err);
      await ctx.reply("❌ Registration failed. Try again later.");
    }
  });

  // Handle contact (phone number)
  bot.on("contact", async (ctx) => {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || "Player";
    const phone = ctx.message?.contact?.phone_number;

    if (!telegramId || !phone) {
      return ctx.reply("❌ Could not get your phone number. Please try again.");
    }

    try {
      await api.registerUser({ telegramId, username, phone });
      await ctx.reply(`✅ Registered successfully!\n👋 Welcome ${username}`, mainMenuKeyboard());
    } catch (err) {
      console.error("❌ Registration error:", err);
      await ctx.reply("❌ Failed to register. Try again later.");
    }
  });
};
