import { Telegraf, Markup } from "telegraf";

export default (bot: Telegraf<any>) => {
  bot.command("play", async (ctx) => {
    await ctx.reply(
      "🎮 Open Rounds:\nRound #42 (2 mins)\nRound #43 (10 mins)",
      Markup.inlineKeyboard([
        Markup.button.webApp("🎫 Choose Card", "https://your-webapp.com/play"),
        Markup.button.callback("⬅ Back", "main_menu"),
      ])
    );
  });
};
