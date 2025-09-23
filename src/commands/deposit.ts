import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { api } from "../services/api"; // adjust path
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN not defined in .env");

const bot = new TelegramBot(token, { polling: true });

// -----------------------------
// User State Interface
// -----------------------------
interface UserState {
  amount?: number;
  name?: string;
  awaitingAmount?: boolean;
  awaitingSMS?: boolean;
}

// store user states
const userData: Record<number, UserState> = {};

// -----------------------------
// Deposit Command
// -----------------------------
bot.onText(/\/deposit/, (msg: Message) => {
  const chatId = msg.chat.id;
  showDepositMenu(chatId);
});

// -----------------------------
// Deposit Menu
// -----------------------------
function showDepositMenu(chatId: number) {
  bot.sendMessage(
    chatId,
    "💳 እባክዎ የገንዘብ መጠን መክፈል ዘዴዎን ይምረጡ:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Manual", callback_data: "deposit_momo" }],
          [{ text: "⬅ Back", callback_data: "main_menu" }],
        ],
      },
    }
  );
}

// -----------------------------
// Handle button callbacks
// -----------------------------
bot.on("callback_query", async (query: CallbackQuery) => {
  if (!query.from?.id || !query.message?.chat.id) return;
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!userData[userId]) userData[userId] = {};

  if (data === "deposit_momo") {
    userData[userId].awaitingAmount = true;
    bot.sendMessage(chatId, "💰 እንዲሞላልዎት የሚፈልጉትን የገንዘብ መጠን ያስገቡ:");
    bot.answerCallbackQuery(query.id);
  }

  if (data === "pay_cbe") {
    userData[userId].awaitingSMS = true;
    const accountNumber = "1000507091419";
    const instructions = `
1. ከላይ ባለው የኢትዮጵያ ንግድ ባንክ አካውንት 50ብር ያስገቡ
2. የምትልኩት መጠን ከዚህ በፊት ያስገቡት መጠን ጋር እኩል መሆን አለበት
3. ከስተላክላችሁ በኋላ የግብይት SMS ይደርሳል
4. ያለባችሁትን SMS በሙሉ copy አድርጉ እና በዚህ ቦት paste አድርጉ
5. ከUSSD(889) በመላክ ከሆነ እባክዎ በትክክል ይጠቀሙ
`;
    bot.sendMessage(chatId, `💳 የክፍያ ዝርዝር:`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📋 Copy Account", callback_data: `copy_account:${accountNumber}` }],
          [{ text: "📋 Copy Instructions", callback_data: `copy_instructions` }],
          [{ text: "⬅ Back", callback_data: "main_menu" }],
        ],
      },
    });
    bot.answerCallbackQuery(query.id);
  }
});

// -----------------------------
// Handle text messages
// -----------------------------
bot.on("message", async (msg: Message) => {
  if (!msg.from?.id || !msg.chat.id || !msg.text) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userData[userId]) return;
  const user = userData[userId];

  // Amount input
  if (user.awaitingAmount) {
    const amount = parseFloat(msg.text);
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

    bot.sendMessage(
      chatId,
      `💳 Payment Details / የክፍያ ዝርዝር\n\n` +
        `Name:          ${user.name}\n` +
        `Phone:         ${phone}\n` +
        `Amount:        ${user.amount} ETB\n` +
        `Reference:     ${reference}\n\n` +
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

  // SMS/FT code input
  if (user.awaitingSMS) {
    user.awaitingSMS = false;
    bot.sendMessage(chatId, `✅ እናመሰግናለን! የSMS/FT ኮድዎ ተቀባል።\n` +
      `የከፈለችሁት መጠን: ${user.amount} ETB`);
  }
});

console.log("✅ Telegram bot started.");
