import TelegramBot, { Message } from "node-telegram-bot-api";
import { getSession, resetSession, withSession, MySession } from "../middlewares/session";

export const withdrawCommand = (bot: TelegramBot) => {
  // Step 1: Trigger withdraw
  bot.onText(/\/withdraw/, (msg: Message) => {
    if (!msg.chat) return;
    const chatId = msg.chat.id;

    const session = getSession(chatId);
    session.state = "awaiting_amount";

    bot.sendMessage(chatId, "🏦 Enter amount to withdraw:");
  });

  // Step 2: Handle messages with session
withSession(bot, (msg: Message, session: MySession) => {
  if (!msg.text || !msg.chat) return;
  const chatId = msg.chat.id;
  const text = msg.text;

  switch (session.state) {
    case undefined:
    case "/withdraw": // handle if user types /withdraw in middle of session
      session.state = "awaiting_amount";
      bot.sendMessage(chatId, "🏦 Enter amount to withdraw:");
      break;

    case "awaiting_amount":
      const amount = Number(text);
      if (isNaN(amount) || amount <= 0) {
        bot.sendMessage(chatId, "❌ Please enter a valid amount.");
        return;
      }
      session.amount = amount;
      session.state = "awaiting_method";

      bot.sendMessage(chatId, "💳 Choose payment method:", {
        reply_markup: {
          keyboard: [
            [{ text: "Telebirr" }],
            [{ text: "CBE" }],
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
      break;

    case "awaiting_method":
      if (text !== "Telebirr" && text !== "CBE") {
        bot.sendMessage(chatId, "❌ Please choose either Telebirr or CBE.");
        return;
      }
      session.tempData = { method: text };
      session.state = "awaiting_account";

      bot.sendMessage(chatId, `📄 Enter your ${text} account number:`);
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
