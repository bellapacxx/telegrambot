import { Telegraf, Markup } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";

export default (bot: Telegraf<any>) => {
  // /deposit command
  bot.command("deposit", async (ctx) => {
    await ctx.reply(
      "💳 እባክዎ የገንዘብ መጠን መክፈል ዘዴዎን ይምረጡ:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📱 Manual", "deposit_momo")],
        [Markup.button.callback("⬅ Back", "main_menu")],
      ])
    );
  });

  // Handle deposit method selection
  bot.action("deposit_momo", async (ctx) => {
    await ctx.reply(
      "💰 እንዲሞላልዎት የሚፈልጉትን የገንዘብ መጠን ያስገቡ:"
    );
    await ctx.answerCbQuery();
  });

  // Fallback for any deposit_* action
  bot.action(/deposit_.*/, async (ctx) => {
    // This can be used if you add more deposit methods later
    await ctx.answerCbQuery();
  });
};
