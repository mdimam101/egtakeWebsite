import axios from "axios";
import SummaryApi from "../common";
import { ensureDeviceId } from "./deviceId";

export default async function signInAsGuest() {
  const deviceId = ensureDeviceId();
  if (!deviceId) throw new Error("Failed to get device id");

  const request = ({ method, url }) => axios({
    method,
    url,
    headers: { "Content-Type": "application/json" },
    data: { deviceId },
    withCredentials: true,
    timeout: 10000,
  });

  try {
    await request(SummaryApi.signUp);
  } catch {
    // An existing device account can sign in even if registration fails.
  }

  const { data } = await request(SummaryApi.signIn);
  if (!data?.success) throw new Error(data?.message || "Login failed");

  if (data.data) localStorage.setItem("authToken", data.data);
}