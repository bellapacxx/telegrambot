import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { api } from "../services/api";
import { getSession } from "../middlewares/session"; // your session helper

// -----------------------------
// Helper: Show deposit menu
// -----------------------------
function showDepositMenu(bot: TelegramBot, chatId: number) {
  bot.sendMessage(chatId, "💳 እባክዎ የገንዘብ መጠን መክፈል ዘዴዎን ይምረጡ:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Manual", callback_data: "deposit_momo" }],
        [{ text: "⬅ Back", callback_data: "main_menu" }],
      ],
    },
  });
}

export function depositCommand(bot: TelegramBot) {
  // ----------------------
  // /deposit command
  // ----------------------
  bot.onText(/\/deposit/, (msg: Message) => {
    const chatId = msg.chat.id;
    showDepositMenu(bot, chatId);
  });

  // ----------------------
  // Handle button callbacks
  // ----------------------
  bot.on("callback_query", async (query: CallbackQuery) => {
    if (!query.from?.id || !query.message?.chat.id || !query.data) return;

    const chatId = query.message.chat.id;
    const telegramId = query.from.id;
    const session = getSession(telegramId); // use session

    try {
      switch (query.data) {
        case "deposit_momo":
          session.state = "awaiting_deposit_amount";
          await bot.sendMessage(chatId, "💰 እባክዎ የገንዘብ መጠን ያስገቡ:");
          break;

        case "main_menu":
           delete session.state;
          // optionally, show your main menu here
          await bot.sendMessage(chatId, "⬅ Back to main menu");
          break;
      }

      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error("[DEPOSIT CALLBACK ERROR]", err);
      await bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
      await bot.answerCallbackQuery(query.id);
    }
  });

  // ----------------------
  // Handle text messages
  // ----------------------
  bot.on("message", async (msg: Message) => {
    if (!msg.from?.id || !msg.chat.id || !msg.text) return;

    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const text = msg.text;

    const session = getSession(telegramId);

    // Only handle if user is in deposit flow
    if (session.state === "awaiting_deposit_amount") {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(chatId, "❌ ትክክለኛ ቁጥር ያስገቡ እባክዎን.");
      }

      session.amount = amount;
      session.name = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") || "User";
      session.state = "deposit_ready";

      const reference = Math.random().toString(36).substring(2, 10).toUpperCase();
      let phone = "Not shared";

      try {
        const dbUser = await api.getUser(telegramId);
        if (dbUser?.phone) phone = dbUser.phone;
      } catch (err) {
        console.error("❌ Failed to fetch phone:", err);
      }

      await bot.sendMessage(
        chatId,
        `💳 Payment Details / የክፍያ ዝርዝር\n\n` +
          `Name:      ${session.name}\n` +
          `Phone:     ${phone}\n` +
          `Amount:    ${session.amount} ETB\n` +
          `Reference: ${reference}\n\n` +
          `ማስገባት ብር የምችሉት ከታች ባሉት አማራጮች ብቻ ነው:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💰 Telebirr → Telebirr", callback_data: "pay_telebirr" }],
              [{ text: "⬅ Back", callback_data: "main_menu" }],
            ],
          },
        }
      );
    }
  });
}

export default depositCommand;
