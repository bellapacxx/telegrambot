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


      case "awaiting_method":
        if (text !== "Telebirr" && text !== "CBE") {
          bot.sendMessage(chatId, "❌ Please choose either Telebirr or CBE.");
          return;
        }
        session.tempData = { method: text }; // store method
        session.state = "awaiting_account";

        bot.sendMessage(chatId, `📄 Enter your ${text} account number:`);
        break;

      case "awaiting_account":
        session.tempData = { ...session.tempData, account: text };

        // Send summary to admin @bpac12
        const adminChatId = "@bpac12"; // replace with numeric ID if needed
        bot.sendMessage(
          adminChatId,
          `💸 New withdrawal request:\nAmount: ${session.amount}\nMethod: ${session.tempData.method}\nAccount: ${session.tempData.account}`
        );

        bot.sendMessage(
  chatId,
  "✅ Your withdrawal request has been submitted!\n\n📌 Please wait up to 2 minutes for processing. If there is any delay, our admin @bpac12 will follow up."
);

        resetSession(chatId); // clear session
        break;

      default:
        break;
    }
  });
};

export default withdrawCommand;
