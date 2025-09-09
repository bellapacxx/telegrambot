import axios from "axios";

const API_BASE = process.env.BACKEND_URL || "https://bingo-backend-production-32e1.up.railway.app";

export const api = {
  registerUser: async (data: any) => axios.post(`${API_BASE}/users`, data),
   // ✅ New method
  checkUser: async (telegramId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/users/${telegramId}`);
      return res.data; // user object if found
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null; // user not found
      }
      throw err; // other errors
    }
  },
  getUser: async (telegramId: number) =>
    axios.get(`${API_BASE}/users/${telegramId}`).then((res) => res.data),
  deposit: async (data: any) => axios.post(`${API_BASE}/deposit`, data),
  withdraw: async (data: any) => axios.post(`${API_BASE}/withdraw`, data),
  buyTicket: async (data: any) => axios.post(`${API_BASE}/tickets`, data),
};
