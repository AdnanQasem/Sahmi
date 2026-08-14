import api from "./api";

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contactService = {
  sendMessage: async (payload: ContactMessagePayload): Promise<{ message: string }> =>
    await api.post("contact/", payload),
};

export default contactService;
