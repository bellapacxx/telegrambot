import { Telegraf, Markup, Context, NarrowedContext } from "telegraf";
import { api } from "../services/api";

export default (bot: Telegraf<Context>) => {
  // ----------------------
  // /play command or menu button
  // ----------------------
  bot.command("play", async (ctx) => showPlayOptions(ctx));
  bot.hears("🎟 Play", async (ctx) => showPlayOptions(ctx));

  // ----------------------
  // Show stake options
  // ----------------------
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

  // ----------------------
  // Handle stake selection
  // ----------------------
  bot.action(/play_\d+/, async (ctx: Context) => {
    if (!ctx.from || !ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

    const telegramId = ctx.from.id;
    const data = ctx.callbackQuery.data as string; // safely cast
    const stake = parseInt(data.replace("play_", ""), 10);

    await ctx.answerCbQuery(); // remove loading indicator

    // Ensure user exists
    const userExists = await api.checkUser(telegramId);
    if (!userExists) {
      await api.registerUser({
        telegram_id: telegramId,
        username: ctx.from.username || ctx.from.first_name || "Anonymous",
        phone: "",
      });
    }

    // Connect to WebSocket lobby
    api.connectLobby(stake, telegramId);

    // Respond to Telegram
    await ctx.reply(
      `🎮 You selected ${stake} ETB.\nYou are now connected to the lobby (backend handles the game).`,
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "Open Lobby in Browser",
            `https://your-frontend-lobby.com/${stake}?user=${telegramId}`
          )
        ]
      ])
    );
  });

  // ----------------------
  // Back button
  // ----------------------
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
