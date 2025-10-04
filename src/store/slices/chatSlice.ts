import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Message, Contact } from '@/types';

interface ChatState {
  contacts: Contact[];
  activeContact: Contact | null;
  messages: Record<string, Message[]>;
  typing: Record<string, boolean>;
  unreadCounts: Record<string, number>;
}

const initialState: ChatState = {
  contacts: [],
  activeContact: null,
  messages: {},
  typing: {},
  unreadCounts: {},
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload;
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      // Verifica se o contato já existe
      const exists = state.contacts.some(c => c.phoneNumber === action.payload.phoneNumber);
      if (!exists) {
        state.contacts.unshift(action.payload); // Adiciona no início da lista
      }
    },
    setActiveContact: (state, action: PayloadAction<Contact | null>) => {
      state.activeContact = action.payload;
      // Clear unread count for this contact
      if (action.payload?.id) {
        state.unreadCounts[action.payload.id] = 0;
      }
    },
    addMessage: (state, action: PayloadAction<{ contactId: string; message: Message }>) => {
      const { contactId, message } = action.payload;
      if (!state.messages[contactId]) {
        state.messages[contactId] = [];
      }
      state.messages[contactId].push(message);

      // Increment unread if not active contact and incoming message
      if (state.activeContact?.id !== contactId && message.fromNumber !== 'self') {
        state.unreadCounts[contactId] = (state.unreadCounts[contactId] || 0) + 1;
      }
    },
    setMessages: (state, action: PayloadAction<{ contactId: string; messages: Message[] }>) => {
      const { contactId, messages } = action.payload;
      state.messages[contactId] = messages;
    },
    updateMessageStatus: (
      state,
      action: PayloadAction<{ contactId: string; messageId: string; status: string }>
    ) => {
      const { contactId, messageId, status } = action.payload;
      const messages = state.messages[contactId];
      if (messages) {
        const message = messages.find(m => m.messageId === messageId);
        if (message) {
          message.status = status as any;
        }
      }
    },
    setTyping: (state, action: PayloadAction<{ contactId: string; isTyping: boolean }>) => {
      const { contactId, isTyping } = action.payload;
      state.typing[contactId] = isTyping;
    },
    clearChat: (state) => {
      state.messages = {};
      state.typing = {};
      state.unreadCounts = {};
    },
  },
});

export const {
  setContacts,
  addContact,
  setActiveContact,
  addMessage,
  setMessages,
  updateMessageStatus,
  setTyping,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
