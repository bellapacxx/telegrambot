import axios from "axios";

const API_BASE = process.env.BACKEND_URL || "https://bingo-backend.railway.internal";

export const api = {
  registerUser: async (data: any) => axios.post(`${API_BASE}/users`, data),
  getUser: async (telegramId: number) =>
    axios.get(`${API_BASE}/users/${telegramId}`).then((res) => res.data),
  deposit: async (data: any) => axios.post(`${API_BASE}/deposit`, data),
  withdraw: async (data: any) => axios.post(`${API_BASE}/withdraw`, data),
  buyTicket: async (data: any) => axios.post(`${API_BASE}/tickets`, data),
};
