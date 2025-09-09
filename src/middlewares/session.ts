import { Context, session } from "telegraf";

export interface MySession {
  state?: string;
  tempData?: any;
}

export type MyContext = Context & { session: MySession };

export const sessionMiddleware = session({ defaultSession: (): MySession => ({}) });
