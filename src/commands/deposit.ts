import { Telegraf, Markup, Context } from "telegraf";
import { api } from "../services/api";

interface UserState {
  amount?: number;
  name?: string;
  awaitingAmount?: boolean;
  awaitingSMS?: boolean;
}

const userData: Record<number, UserState> = {};

export default (bot: Telegraf<Context>) => {
  // Deposit command (manual typing)
  bot.command("deposit", async (ctx) => {
    await showDepositMenu(ctx);
  });

  // Deposit button (from main menu inlineKeyboard)
  bot.action("deposit", async (ctx) => {
    await ctx.answerCbQuery();
    await showDepositMenu(ctx);
  });

  // Reusable deposit menu
  async function showDepositMenu(ctx: Context) {
    await ctx.reply(
      "💳 እባክዎ የገንዘብ መጠን መክፈል ዘዴዎን ይምረጡ:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📱 Manual", "deposit_momo")],
        [Markup.button.callback("⬅ Back", "main_menu")],
      ])
    );
  }

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

    // Handle amount input
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

      // Get phone from DB
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
          `ማስገባት ብር የምችሉት ከታች ባሉት አማራጮች ብቻ ነው:`,
        Markup.inlineKeyboard([
          [Markup.button.callback("💰 Telebirr → Telebirr", "pay_telebirr")],
          [Markup.button.callback("🏦 CBE → CBE", "pay_cbe")],
          [Markup.button.callback("⬅ Back", "main_menu")],
        ])
      );
      return;
    }

    // Handle SMS/FT code reply
    if (user.awaitingSMS) {
      const smsCode = ctx.message.text.trim();
      if (!smsCode) return ctx.reply("❌ እባክዎ የደረሰውን SMS/FT ኮድ ያስገቡ.");

      user.awaitingSMS = false;
      userData[userId] = user;

      await ctx.reply(
        `✅ እናመሰግናለን! የSMS/FT ኮድዎ ተቀባል።\n` +
          `እባክዎ በጥቂት ጊዜ የመጠኑ ሂደት ይሙሉ።\n` +
          `የከፈለችሁት መጠን: ${user.amount} ETB`
      );
    }
  });

  // CBE bank instructions with copyable format
  bot.action("pay_cbe", async (ctx) => {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id;
    if (!userId) return;

    if (!userData[userId]) userData[userId] = {};
    userData[userId].awaitingSMS = true; // wait for SMS/FT code

    const accountNumber = "1000507091419";

    await ctx.reply(
      `\n\n${accountNumber}\n\n` +
        `1. ከላይ ባለው የኢትዮጵያ ንግድ ባንክ አካውንት 50ብር ያስገቡ\n` +
        `2. የምትልኩት የገንዘብ መጠን እና እዚ ላይ እንዲሞላልዎ የምታስገቡት መጠን ተመሳሳይ መሆኑን እርግጠኛ ይሁኑ\n` +
        `3. ብሩን ስትልኩ የከፈለችሁበትን መረጃ የያዝ አጭር የጹሁፍ መልክት(sms) ከኢትዮጵያ ንግድ ባንክ ይደርሳችኋል\n` +
        `4. የደረሳችሁን አጭር የጹሁፍ መለክት(sms) ሙሉዉን ኮፒ(copy) በማረግ በዚህ የቴሌግራም ማስገቢያ ላይ ፔስት(paste) በማድረግ ይላኩት\n` +
        `5. ብር ስትልኩ የምትጠቀሙት USSD(889) ከሆነ ...\n\n` +
        `የከፈለችሁበትን አጭር የጹሁፍ መለክት(sms) ወይም FT ብሎ የሚጀምረው የትራንዛክሽን ቁጥር እዚ ላይ ያስገቡት 👇👇👇`
    );
  });
};
