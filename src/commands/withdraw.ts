import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import { getSession, resetSession, withSession, MySession } from "../middlewares/session";

export const withdrawCommand = (bot: TelegramBot) => {
  // Handle inline button clicks
  bot.on("callback_query", (query: CallbackQuery) => {
    const chatId = query.message?.chat.id;
    if (!chatId || !query.data) return;

    const session = getSession(chatId);

    // Withdraw from main menu
    if (query.data === "withdraw") {
      session.state = "awaiting_amount";
      bot.sendMessage(chatId, "🏦 Enter amount to withdraw:");
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Telebirr/CBE selection buttons
    if (query.data === "method_telebirr" || query.data === "method_cbe") {
      session.tempData = { method: query.data === "method_telebirr" ? "Telebirr" : "CBE" };
      session.state = "awaiting_account";

      bot.sendMessage(chatId, `📄 Enter your ${session.tempData.method} account number:`);
      bot.answerCallbackQuery(query.id);
      return;
    }
  });

  // Handle the step-by-step withdraw flow
  withSession(bot, (msg: Message, session: MySession) => {
    if (!msg.text || !msg.chat) return;
    const chatId = msg.chat.id;
    const text = msg.text;

    switch (session.state) {
      case "awaiting_amount":
        const amount = Number(text);
        if (isNaN(amount) || amount <= 0) {
          bot.sendMessage(chatId, "❌ Please enter a valid amount.");
          return;
        }
        session.amount = amount;
        session.state = "awaiting_method";

        // Show inline buttons for method selection
        bot.sendMessage(chatId, "💳 Choose payment method:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Telebirr", callback_data: "method_telebirr" }],
              [{ text: "CBE", callback_data: "method_cbe" }],
            ],
          },
        });
        break;

      case "awaiting_account":
        session.tempData = { ...session.tempData, account: text };

        const adminChatId = "@bpac12";
        bot.sendMessage(
          adminChatId,
          `💸 New withdrawal request:\nAmount: ${session.amount}\nMethod: ${session.tempData.method}\nAccount: ${session.tempData.account}`
        );

        bot.sendMessage(
          chatId,
          "✅ Your withdrawal request has been submitted!\n\n📌 Please wait up to 2 minutes for processing. If there is any delay, our admin @bpac12 will follow up."
        );

        resetSession(chatId);
        break;

      default:
        break;
    }
  });
};

export default withdrawCommand;
