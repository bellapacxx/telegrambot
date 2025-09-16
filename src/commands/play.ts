import { Telegraf, Markup, Context } from "telegraf";
import { api } from "../services/api"; // your axios wrapper

export default (bot: Telegraf<Context>) => {

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

  bot.action(/play_\d+/, async (ctx) => {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const data = ctx.callbackQuery.data as string;
    const stake = parseInt(data.replace("play_", ""), 10);

    await ctx.answerCbQuery();

    // 1️⃣ Ensure user exists
    let userExists = await api.checkUser(telegramId);
    if (!userExists) {
      await api.registerUser({
        telegram_id: telegramId,
        username: ctx.from?.username || ctx.from?.first_name || "Anonymous",
        phone: "", // optional, can update later
      });
    }

   

    // 4️⃣ Provide WebSocket link to lobby
    const lobbyWsUrl = `${process.env.BACKEND_WS || "wss://bingo-backend-production-32e1.up.railway.app/ws"}/${stake}?user=${telegramId}`;
    await ctx.reply(
      `Connect to lobby to watch the game live:`,
      Markup.inlineKeyboard([
        [Markup.button.url("Join Lobby", lobbyWsUrl)],
      ])
    );
  });

  bot.action("main_menu", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      "⬅ Back to main menu",
      Markup.keyboard([
        ["💰 Balance", "💵 Deposit"],
        ["🎟 Play", "💸 Withdraw"]
      ]).resize()
    );
  });
};
