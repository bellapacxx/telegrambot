import { Telegraf, Markup, Context } from "telegraf";
import { api } from "../services/api";

export default (bot: Telegraf<Context>) => {
  // /play command or menu button
  bot.command("play", async (ctx) => {
    await showPlayOptions(ctx);
  });

  bot.hears("🎟 Play", async (ctx) => {
    await showPlayOptions(ctx);
  });

  const showPlayOptions = async (ctx: Context) => {
    await ctx.reply(
      "🎮 Choose your stake:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("Play 10", "play_10"),
          Markup.button.callback("Play 20", "play_20"),
        ],
        [
          Markup.button.callback("Play 50", "play_50"),
          Markup.button.callback("Play 100", "play_100"),
        ],
        [Markup.button.callback("⬅ Back", "main_menu")],
      ])
    );
  };

  // Handle stake selection safely
  bot.action(/play_\d+/, async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const data = ctx.callbackQuery?.chat_instance;
    if (!data) return;

    const stake = parseInt(data.replace("play_", ""), 10);

    await ctx.answerCbQuery();

    // Ensure user exists
    const userExists = await api.checkUser(telegramId);
    if (!userExists) {
      await api.registerUser({
        telegram_id: telegramId,
        username: ctx.from?.username || ctx.from?.first_name || "Anonymous",
        phone: "",
      });
    }

    // Respond with WebSocket lobby link
    const lobbyWsUrl = `${process.env.BACKEND_WS || "wss://bingo-backend-production-32e1.up.railway.app/ws"}/${stake}?telegram_id=${telegramId}`;
    await ctx.reply(
      `🎮 You selected ${stake} ETB.\nConnect to the lobby to watch the game live:`,
      Markup.inlineKeyboard([[Markup.button.url("Join Lobby", lobbyWsUrl)]])
    );
  });

  // Back button
  bot.action("main_menu", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      "⬅ Back to main menu",
      Markup.keyboard([
        ["💰 Balance", "💵 Deposit"],
        ["🎟 Play", "💸 Withdraw"],
      ]).resize()
    );
  });
};
