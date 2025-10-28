// src/server.ts
import express from "express";
import "./bot"; // start your bot

const app = express();

app.get("/", (_, res) => res.send("✅ Telegram bot running via polling!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Dummy server running on port ${PORT}`);
});
