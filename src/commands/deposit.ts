import { Telegraf, Markup, Context } from "telegraf";

const userData: Record<number, { amount?: number; phone?: string; name?: string }> = {};

export default (bot: Telegraf<Context>) => {
  bot.command("deposit", async (ctx) => {
    await ctx.reply(
      "💳 እባክዎ የገንዘብ መጠን መክፈል ዘዴዎን ይምረጡ:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📱 Manual", "deposit_momo")],
        [Markup.button.callback("⬅ Back", "main_menu")],
      ])
    );
  });

  bot.action("deposit_momo", async (ctx) => {
    await ctx.reply("💰 እንዲሞላልዎት የሚፈልጉትን የገንዘብ መጠን ያስገቡ:");
    await ctx.answerCbQuery();
  });

  // Save contact if shared
  bot.on("contact", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    userData[userId] = {
      ...(userData[userId] || {}),
      phone: ctx.message.contact.phone_number,
    };

    await ctx.reply("✅ Phone number received!");
  });

  // Handle amount input
  bot.on("text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = userData[userId] || {};

    if (!user.amount) {
      const amount = parseFloat(ctx.message.text);
      if (isNaN(amount) || amount <= 0) {
        return ctx.reply("❌ ትክክለኛ ቁጥር ያስገቡ እባክዎን.");
      }

      user.amount = amount;

      // Get user's name from Telegram
      user.name = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || "User";

      userData[userId] = user;

      const reference = Math.random().toString(36).substring(2, 10);

      await ctx.reply(
        `💳 Payment Details / የክፍያ ዝርዝር\n\n` +
          `Name:          ${user.name}\n` +
          `Phone:         ${user.phone || "Not shared"}\n` +
          `Amount:        ${user.amount} ETB\n` +
          `Reference:     ${reference}\n\n` +
          `ብር ማስገባት የምችሉት ከታች ባሉት አማራጮች ብቻ ነው:\n` +
          `1. ከቴሌብር → ኤጀንት ቴሌብር\n2. ከንግድ ባንክ → ኤጀንት ንግድ ባንክ\n3. ከሲቢኢ ብር → ኤጀንት ሲቢኢ ብር\n4. ከአቢሲኒያ ባንክ → ኤጀንት አቢሲኒያ ባንክ`,
        Markup.inlineKeyboard([
          [Markup.button.callback("CBE → CBE", "pay_cbe")],
          [Markup.button.callback("Telebirr → Telebirr", "pay_telebirr")],
          [Markup.button.callback("Commercial Bank", "pay_commercial")],
          [Markup.button.callback("Abyssinia Bank", "pay_abyssinia")],
        ])
      );
    }
  });
};
