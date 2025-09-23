import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

export const playCommand = (bot: TelegramBot) => {
  // ----------------------
  // Show play options
  // ----------------------
  const showPlayOptions = (chatId: number) => {
    const options: TelegramBot.SendMessageOptions = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Play 10", callback_data: "play_10" },
            { text: "Play 20", callback_data: "play_20" },
          ],
          [
            { text: "Play 50", callback_data: "play_50" },
            { text: "Play 100", callback_data: "play_100" },
          ],
          [{ text: "⬅ Back", callback_data: "main_menu" }],
        ],
      },
    };

    return bot.sendMessage(chatId, "🎮 Choose your stake:", options);
  };

  // ----------------------
  // /play command
  // ----------------------
  bot.onText(/\/play/, (msg: Message) => {
    showPlayOptions(msg.chat.id);
  });

  // ----------------------
  // Handle button callbacks
  // ----------------------
  bot.on("callback_query", async (query: CallbackQuery) => {
    const chatId = query.message?.chat.id;
    const telegramId = query.from?.id;
    const data = query.data;

    if (!chatId || !telegramId || !data) return;

    // Back to main menu
    if (data === "main_menu") {
      await bot.sendMessage(chatId, "⬅ Back to main menu", {
        reply_markup: mainMenuKeyboard(),
      });
      return bot.answerCallbackQuery(query.id);
    }

    // Show stake options
    if (data === "play") {
      await showPlayOptions(chatId);
      return bot.answerCallbackQuery(query.id);
    }

    // Handle stake selection
    if (/play_\d+/.test(data)) {
      const stake = parseInt(data.replace("play_", ""), 10);
      await bot.answerCallbackQuery(query.id);

      // Ensure user exists
      const userExists = await api.checkUser(telegramId);
      if (!userExists) {
        await api.registerUser({
          telegram_id: telegramId,
          username: query.from.username || query.from.first_name || "Anonymous",
          phone: "",
        });
      }

      // Connect to WebSocket lobby
      api.connectLobby(stake, telegramId);

      // Respond to Telegram
      await bot.sendMessage(
        chatId,
        `🎮 You selected ${stake} ETB.\nYou are now connected to the lobby.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Open Lobby in Browser",
                  url: `https://your-frontend-lobby.com/${stake}?user=${telegramId}`,
                },
              ],
            ],
          },
        }
      );
    }
  });
};
