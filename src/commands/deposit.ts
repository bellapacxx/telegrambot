import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { api } from "../services/api";
import { getSession, resetSession } from "../middlewares/session";

// -----------------------------
// Helpers
// -----------------------------
function showDepositMenu(bot: TelegramBot, chatId: number) {
  console.log("[DEBUG] Showing deposit menu to chat:", chatId);
  return bot.sendMessage(chatId, "💳 እባክዎ የገንዘብ መክፈል ዘዴዎን ይምረጡ:", {
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

  console.log("[DEBUG] Showing payment details:", {
    name: session.name,
    phone,
    amount: session.amount,
    reference: session.reference,
  });

  function escapeMarkdownV2(text: string) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
  }

  const name = escapeMarkdownV2(session.name);
  const phoneEscaped = escapeMarkdownV2(phone);
  const amount = escapeMarkdownV2(String(session.amount));
  const reference = escapeMarkdownV2(session.reference);

  const depositMethods = escapeMarkdownV2(
    `1. ከቴሌብር ወደ ኤጀንት ቴሌብር ብቻ
2. ከንግድ ባንክ ወደ ኤጀንት ንግድ ባንክ ብቻ
3. ከሲቢኢ ብር ወደ ኤጀንት ሲቢኢ ብር ብቻ
4. ከአቢሲኒያ ባንክ ወደ ኤጀንት አቢሲኒያ ባንክ ብቻ`
  );

  const codeBlock = `\`\`\`
Name:      ${name}
Phone:     ${phoneEscaped}
Amount:    ${amount}ETB
Reference: ${reference}
\`\`\`

ብር ማስገባት የምችሉት ከታች ባሉት አማራጮች ብቻ ነው:
${depositMethods}`;

  return bot.sendMessage(chatId, codeBlock, {
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💰 Telebirr → Telebirr", callback_data: "pay_telebirr" }],
        [{ text: "⬅ Back", callback_data: "main_menu" }],
      ],
    },
  });
}

async function showTelebirrPayment(bot: TelegramBot, chatId: number, session: any) {
  const account = "0952264228";

  function escapeMarkdownV2(text: string) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
  }

  const amount = escapeMarkdownV2(String(session.amount));

  const codeBlock = `\`\`\`
${escapeMarkdownV2(account)}
\`\`\`

${escapeMarkdownV2(
    `1. ከላይ ባለው የቴሌብር አካውንት ${amount}ብር ያስገቡ
2. የምትልኩት የገንዘብ መጠን እና እዚ ላይ እንዲሞላው የምታስገቡት የብር መጠን ተመሳሳይ መሆኑን እርግጠኛ ይሁኑ
3. ብሩን ስትልኩ የከፈላችሁበትን መረጃ አጭር መልክት(sms) ከቴሌብር ይደርሳችሁ
4. የደረሳችሁን መልክት(sms) ሙሉ ኮፒ(copy) በመስቀል በታች ባለው ቴሌግራም ፔስት(paste) ይላኩት`
  )}`;

  return bot.sendMessage(chatId, codeBlock, { parse_mode: "MarkdownV2" });
}

// -----------------------------
// Deposit Command
// -----------------------------
export function depositCommand(bot: TelegramBot) {
  bot.onText(/\/deposit/, (msg: Message) => {
    console.log("[DEBUG] /deposit command received from chat:", msg.chat.id);
    showDepositMenu(bot, msg.chat.id);
  });

  bot.on("callback_query", async (query: CallbackQuery) => {
    if (!query.from?.id || !query.message?.chat.id || !query.data) return;

    const chatId = query.message.chat.id;
    const session = getSession(chatId);

    console.log("[DEBUG] Callback query received:", {
      data: query.data,
      chatId,
      userId: query.from.id,
      session,
    });

    try {
      switch (query.data) {
        case "deposit":
          resetSession(chatId);
          await showDepositMenu(bot, chatId);
          break;

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
            await showTelebirrPayment(bot, chatId, session);
          }
          break;
      }

      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error("[DEPOSIT CALLBACK ERROR]", err);
      if (query.id) await bot.answerCallbackQuery(query.id, { text: "❌ Error" });
    }
  });

  bot.on("message", async (msg: Message) => {
    if (!msg.from?.id || !msg.chat.id || !msg.text) return;

    const chatId = msg.chat.id;
    const session = getSession(chatId);
    const text = msg.text.trim();

    if (session.state !== "awaiting_deposit_amount") return;

    console.log("[DEBUG] Deposit amount input received:", { text, chatId, userId: msg.from.id });

    try {
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
