import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { api } from "../services/api";
import { getSession, resetSession } from "../middlewares/session";

// -----------------------------
// Helpers
// -----------------------------
function showDepositMenu(bot: TelegramBot, chatId: number) {
  return bot.sendMessage(chatId, "💳 እባክዎ የገንዘብ መጠን መክፈል ዘዴዎን ይምረጡ:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Manual", callback_data: "deposit_momo" }],
        [{ text: "⬅ Back", callback_data: "main_menu" }],
      ],
    },
  });
}

async function showPaymentDetails(bot: TelegramBot, chatId: number, session: any, msg: Message) {
  let phone = "Not shared";
  try {
    const dbUser = await api.getUser(msg.from!.id);
    if (dbUser?.phone) phone = dbUser.phone;
  } catch (err) {
    console.error("❌ Failed to fetch phone:", err);
  }

  return bot.sendMessage(
    chatId,
    `💳 Payment Details / የክፍያ ዝርዝር\n\n` +
      `Name:      ${session.name}\n` +
      `Phone:     ${phone}\n` +
      `Amount:    ${session.amount} ETB\n` +
      `Reference: ${session.reference}\n\n` +
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

// -----------------------------
// Deposit Command
// -----------------------------
export function depositCommand(bot: TelegramBot) {
  // Handle /deposit
  bot.onText(/\/deposit/, (msg: Message) => {
    console.log("[DEBUG] /deposit command from", msg.chat.id);
    showDepositMenu(bot, msg.chat.id);
  });

  // Handle callbacks
  bot.on("callback_query", async (query: CallbackQuery) => {
    try {
      if (!query.from?.id || !query.message?.chat.id || !query.data) return;

      const chatId = query.message.chat.id;
      const session = getSession(chatId);

      switch (query.data) {
        case "deposit_momo":
          session.state = "awaiting_deposit_amount";
          await bot.sendMessage(chatId, "💰 እባክዎ የገንዘብ መጠን ያስገቡ:");
          break;

        case "main_menu":
          resetSession(chatId);
          await bot.sendMessage(chatId, "⬅ Back to main menu");
          break;

        case "pay_telebirr":
          if (session.state !== "deposit_ready") {
            await bot.sendMessage(chatId, "⚠ እባክዎ በመጀመሪያ መጠን ያስገቡ.");
          } else {
            await bot.sendMessage(
              chatId,
              `✅ Use Telebirr to send ${session.amount} ETB.\nReference: ${session.reference}`
            );
          }
          break;
      }

      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error("[DEPOSIT CALLBACK ERROR]", err);
      if (query.id) await bot.answerCallbackQuery(query.id, { text: "❌ Error" });
    }
  });

  // Handle messages (deposit amount input)
  bot.on("message", async (msg: Message) => {
    try {
      if (!msg.from?.id || !msg.chat.id || !msg.text) return;

      const chatId = msg.chat.id;
      const session = getSession(chatId);
      const text = msg.text.trim();

      if (session.state !== "awaiting_deposit_amount") return;

      console.log("[DEBUG] Processing deposit amount:", text);

      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(chatId, "❌ ትክክለኛ ቁጥር ያስገቡ እባክዎን.");
      }

      session.amount = amount;
      session.name = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") || "User";
      session.reference = Math.random().toString(36).substring(2, 10).toUpperCase();
      session.state = "deposit_ready";

      await showPaymentDetails(bot, chatId, session, msg);
    } catch (err) {
      console.error("[DEPOSIT MESSAGE ERROR]", err);
    }
  });
}
