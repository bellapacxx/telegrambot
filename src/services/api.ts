import axios from "axios";

const API_BASE = process.env.BACKEND_URL || "https://bingo-backend-production-32e1.up.railway.app";


  

export const api = {
  // Check if user exists
  async checkUser(telegramId: number) {
    try {
      const res = await axios.get(`${API_BASE}/users/${telegramId}`);
      return res.status === 200;
    } catch (err: any) {
      if (err.response?.status === 404) return false;
      throw err;
    }
  },

  // Register a new user
  async registerUser(user: { telegram_id: number; "username": string; phone: string }) {
    const res = await axios.post(`${API_BASE}/users`, user);
    return res.data;
  },

  // Update phone number
  async updatePhone(telegramId: number, phone: string) {
    const res = await axios.put(`${API_BASE}/users/${telegramId}/phone`, { phone });
    return res.data;
  },
  getUser: async (telegramId: number) =>
    axios.get(`${API_BASE}/users/${telegramId}`).then((res) => res.data),
  deposit: async (data: any) => axios.post(`${API_BASE}/deposit`, data),
  withdraw: async (data: any) => axios.post(`${API_BASE}/withdraw`, data),
  buyTicket: async (data: any) => axios.post(`${API_BASE}/tickets`, data),
};
