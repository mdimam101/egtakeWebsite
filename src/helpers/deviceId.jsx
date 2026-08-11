// src/utils/deviceId.js
import { v4 as uuidv4 } from "uuid";

const KEY = "Pyzara:deviceId";
const CHAT_GUEST_KEY = "Pyzara:chatGuestId";

/** Ensure there is a deviceId in storage; returns it */
export function ensureDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    const platform = "web";
    id = `Pyzara${uuidv4()}_${platform}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/** Read deviceId if already created (may be null) */
export function getDeviceId() {
  return localStorage.getItem(KEY);
}

/** Chat API expects a plain UUID for guest ownership. */
export function ensureChatGuestId() {
  let id = localStorage.getItem(CHAT_GUEST_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(CHAT_GUEST_KEY, id);
  }
  return id;
}