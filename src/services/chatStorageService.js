import axios from "axios";
import { API } from "../types";
import { getUserData } from "../userStore/userData";

const API_BASE_URL = API;

// --- IndexedDB for "Unlimited" Storage ---
const DB_NAME = 'AIChatStorage';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

const getDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const dbAction = (type, mode, callback) => {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    callback(store, resolve, reject);
  }));
};

const idbGet = (key) => new Promise((resolve, reject) => {
  getDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
});

const idbSet = (key, value) => {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
};

const idbDel = (key) => {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
};

const idbGetAllKeys = () => new Promise((resolve, reject) => {
  getDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
});

// --- Service ---

export const chatStorageService = {

  async getSessions() {
    try {
      const token = getUserData()?.token;
      // Try Backend First
      const response = await fetch(`${API_BASE_URL}/chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Backend failed");
      return await response.json();
    } catch (error) {
      console.warn("Using IndexedDB storage fallback.");
      const sessions = [];
      const keys = await idbGetAllKeys();

      for (const key of keys) {
        if (key.startsWith("chat_meta_")) {
          const sessionId = key.replace("chat_meta_", "");
          const meta = await idbGet(key) || {};
          sessions.push({
            sessionId,
            title: meta.title || "New Chat",
            lastModified: meta.lastModified || Date.now(),
          });
        }
      }
      return sessions.sort((a, b) => b.lastModified - a.lastModified);
    }
  },

  async getHistory(sessionId) {
    if (sessionId === "new") return [];
    try {
      const token = getUserData()?.token;
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 404) return [];
      if (!response.ok) throw new Error("Backend error");
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      const local = await idbGet(`chat_history_${sessionId}`);
      return local || [];
    }
  },

  async saveMessage(sessionId, message, title) {
    try {
      const token = getUserData()?.token;
      if (!token) throw new Error("No token");
      await axios.post(`${API_BASE_URL}/chat/${sessionId}/message`, { message, title }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      // Local Fallback (IndexedDB)
      const historyKey = `chat_history_${sessionId}`;
      const metaKey = `chat_meta_${sessionId}`;

      const messages = (await idbGet(historyKey)) || [];
      const existingIndex = messages.findIndex(m => m.id === message.id);

      if (existingIndex !== -1) {
        messages[existingIndex] = message; // Update
      } else {
        messages.push(message); // Insert
      }

      await idbSet(historyKey, messages);

      const existingMeta = (await idbGet(metaKey)) || {};
      const meta = {
        title: title || existingMeta.title || "New Chat",
        lastModified: Date.now(),
      };
      await idbSet(metaKey, meta);
    }
  },

  async deleteSession(sessionId) {
    try {
      const token = getUserData()?.token;
      await axios.delete(`${API_BASE_URL}/chat/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      await idbDel(`chat_history_${sessionId}`);
      await idbDel(`chat_meta_${sessionId}`);
    }
  },

  async deleteMessage(sessionId, messageId) {
    try {
      const token = getUserData()?.token;
      if (token) {
        await axios.delete(`${API_BASE_URL}/chat/${sessionId}/message/${messageId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn("Backend delete failed, converting to local update");
    }

    const historyKey = `chat_history_${sessionId}`;
    const messages = (await idbGet(historyKey)) || [];
    const filtered = messages.filter(m => m.id !== messageId);
    await idbSet(historyKey, filtered);
  },

  async updateMessage(sessionId, updatedMsg) {
    const historyKey = `chat_history_${sessionId}`;
    const messages = (await idbGet(historyKey)) || [];
    const index = messages.findIndex(m => m.id === updatedMsg.id);
    if (index !== -1) {
      messages[index] = updatedMsg;
      await idbSet(historyKey, messages);
    }
  },

  async createSession() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
};
