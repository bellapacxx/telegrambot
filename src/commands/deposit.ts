import { Telegraf, Markup, Context } from "telegraf";
import { api } from "../services/api";

interface UserState {
  amount?: number;
  name?: string;
  awaitingAmount?: boolean;
}

const userData: Record<number, UserState> = {};

export default (bot: Telegraf<Context>) => {
  // Deposit command
  bot.command("deposit", async (ctx) => {
    await ctx.reply(
      "💳 እባክዎ የገንዘብ መጠን መክፈል ዘዴዎን ይምረጡ:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📱 Manual", "deposit_momo")],
        [Markup.button.callback("⬅ Back", "main_menu")],
      ])
    );
  });

  // User chooses Manual deposit
  bot.action("deposit_momo", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    if (!userData[userId]) userData[userId] = {};

    userData[userId].awaitingAmount = true;

    await ctx.reply("💰 እንዲሞላልዎት የሚፈልጉትን የገንዘብ መጠን ያስገቡ:");
    await ctx.answerCbQuery();
  });

  // Handle amount input
  bot.on("text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = userData[userId] || {};

    if (user.awaitingAmount) {
      const amount = parseFloat(ctx.message.text);

      if (isNaN(amount) || amount <= 0) {
        return ctx.reply("❌ ትክክለኛ ቁጥር ያስገቡ እባክዎን.");
      }

      user.amount = amount;
      user.name =
        [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") ||
        "User";
      user.awaitingAmount = false;

      userData[userId] = user;

      const reference = Math.random().toString(36).substring(2, 10).toUpperCase();

      // ✅ Get phone from DB (already registered earlier)
      let phone = "Not shared";
      try {
        const dbUser = await api.getUser(userId);
        if (dbUser?.phone) phone = dbUser.phone;
      } catch (err) {
        console.error("❌ Failed to fetch phone:", err);
      }

      await ctx.reply(
        `💳 Payment Details / የክፍያ ዝርዝር\n\n` +
          `Name:          ${user.name}\n` +
          `Phone:         ${phone}\n` +
          `Amount:        ${user.amount} ETB\n` +
          `Reference:     ${reference}\n\n` +
          `ብር ማስገባት የምችሉት ከታች ባሉት አማራጮች ብቻ ነው:\n` +
          `1. ከቴሌብር → ቴሌብር\n` +
          `2. ከንግድ ባንክ → ንግድ ባንክ\n` +
          `3. ከሲቢኢ ብር → ኤጀንት ሲቢኢ ብር\n` +
          `4. ከአቢሲኒያ ባንክ → ኤጀንት አቢሲኒያ ባንክ`,
        Markup.inlineKeyboard([
          [Markup.button.callback("💰 Telebirr → Telebirr", "pay_telebirr")],
          [Markup.button.callback("🏦 CBE → CBE", "pay_cbe")],
          [Markup.button.callback("⬅ Back", "main_menu")],
        ])
      );
    }
  });
};
