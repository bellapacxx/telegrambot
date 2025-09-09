import { Markup } from "telegraf";

export const mainMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("🎮 Play Bingo", "play")],
    [
      Markup.button.callback("💳 Deposit", "deposit"),
      Markup.button.callback("🏦 Withdraw", "withdraw"),
    ],
    [Markup.button.callback("📊 Balance", "balance")],
    [Markup.button.callback("❓ Help", "help")],
  ]);
