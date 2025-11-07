// src/utils/deviceId.js
import { v4 as uuidv4 } from "uuid";

const KEY = "egtake:deviceId";

/** Ensure there is a deviceId in storage; returns it */
export function ensureDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    const platform = "web";
    id = `egtake_${uuidv4()}_${platform}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/** Read deviceId if already created (may be null) */
export function getDeviceId() {
  return localStorage.getItem(KEY);
}
