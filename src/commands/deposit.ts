import { Telegraf, Markup } from "telegraf";
import { mainMenuKeyboard } from "../keyboards/mainMenu";

export default (bot: Telegraf<any>) => {
  bot.command("deposit", async (ctx) => {
    await ctx.reply(
      "💳 Choose deposit method:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📱 Mobile Money", "deposit_momo")],
        [Markup.button.callback("🏦 Bank Transfer", "deposit_bank")],
        [Markup.button.callback("₿ Crypto", "deposit_crypto")],
        [Markup.button.callback("⬅ Back", "main_menu")],
      ])
    );
  });

  bot.action(/deposit_.*/, async (ctx) => {
    await ctx.reply("✅ Deposit flow placeholder. Integrate your payment gateway here.");
    await ctx.answerCbQuery();
  });
};
