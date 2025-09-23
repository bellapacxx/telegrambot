import TelegramBot, { Message } from "node-telegram-bot-api";
import { mainMenuKeyboard } from "../keyboards/mainMenu";

export const withdrawCommand = (bot: TelegramBot) => {
  bot.onText(/\/withdraw/, (msg: Message) => {
    const chatId = msg.chat.id;

    // Ask user for withdrawal amount
    bot.sendMessage(chatId, "🏦 Enter amount to withdraw:", {
      reply_markup: mainMenuKeyboard(), // optional, you can omit if you want plain text input
    });

    // Store state if you have a user session object
    // Example: userData[chatId] = { state: "awaiting_withdraw_amount" };
  });
};
export default withdrawCommand;