import TelegramBot from "node-telegram-bot-api";

export interface MySession {
  state?: string;
  tempData?: any;
}

// Simple in-memory session store
const sessions: Record<number, MySession> = {};

// Get session for a chat
export const getSession = (chatId: number): MySession => {
  if (!sessions[chatId]) {
    sessions[chatId] = {};
  }
  return sessions[chatId];
};

// Middleware-like wrapper (manual since node-telegram-bot-api has no middleware)
export const withSession = (
  bot: TelegramBot,
  handler: (msg: TelegramBot.Message, session: MySession) => void
) => {
  bot.on("message", (msg) => {
    if (!msg.chat) return;
    const session = getSession(msg.chat.id);
    handler(msg, session);
  });
};
