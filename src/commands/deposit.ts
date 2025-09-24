import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { api } from "../services/api";

interface UserState {
  amount?: number;
  name?: string;
  awaitingAmount?: boolean;
  awaitingSMS?: boolean;
}

const userData: Record<number, UserState> = {};

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

    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (!userData[userId]) userData[userId] = {};
    const user = userData[userId];

    try {
      switch (data) {
        case "deposit_momo":
          user.awaitingAmount = true;
          await bot.sendMessage(chatId, "💰 እባክዎ የገንዘብ መጠን ያስገቡ:");
          break;

        case "pay_cbe":
          user.awaitingSMS = true;
          const accountNumber = "1000507091419";
          await bot.sendMessage(chatId, `💳 የክፍያ ዝርዝር:`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "📋 Copy Account", callback_data: `copy_account:${accountNumber}` }],
                [{ text: "📋 Copy Instructions", callback_data: `copy_instructions` }],
                [{ text: "⬅ Back", callback_data: "main_menu" }],
              ],
            },
          });
          break;

        case "main_menu":
          showDepositMenu(bot, chatId);
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

    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userData[userId]) return;
    const user = userData[userId];

    // Handle amount input
    if (user.awaitingAmount) {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(chatId, "❌ ትክክለኛ ቁጥር ያስገቡ እባክዎን.");
      }

      user.amount = amount;
      user.name = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") || "User";
      user.awaitingAmount = false;

      const reference = Math.random().toString(36).substring(2, 10).toUpperCase();
      let phone = "Not shared";

      try {
        const dbUser = await api.getUser(userId);
        if (dbUser?.phone) phone = dbUser.phone;
      } catch (err) {
        console.error("❌ Failed to fetch phone:", err);
      }

      await bot.sendMessage(
        chatId,
        `💳 Payment Details / የክፍያ ዝርዝር\n\n` +
          `Name:      ${user.name}\n` +
          `Phone:     ${phone}\n` +
          `Amount:    ${user.amount} ETB\n` +
          `Reference: ${reference}\n\n` +
          `ማስገባት ብር የምችሉት ከታች ባሉት አማራጮች ብቻ ነው:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💰 Telebirr → Telebirr", callback_data: "pay_telebirr" }],
              [{ text: "🏦 CBE → CBE", callback_data: "pay_cbe" }],
              [{ text: "⬅ Back", callback_data: "main_menu" }],
            ],
          },
        }
      );
    }

    // Handle SMS/FT code input
    if (user.awaitingSMS) {
      user.awaitingSMS = false;
      await bot.sendMessage(chatId, `✅ እናመሰግናለን! የSMS/FT ኮድዎ ተቀባል።\n` +
        `የከፈለችሁት መጠን: ${user.amount} ETB`);
    }
  });
}

export default depositCommand;
