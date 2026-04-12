import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import SummaryApi from "../common/index";
import { ensureDeviceId, getDeviceId } from "../helpers/deviceId";
import Context from "../context";

export default function SignupPage() {
  const navigate = useNavigate();
  const { fetchUserDetails } = useContext(Context) || {
    fetchUserDetails: () => {},
  };

  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [readyDeviceId, setReadyDeviceId] = useState(null);

  // .env থেকে client id নাও
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    const id = ensureDeviceId();
    setReadyDeviceId(id);
  }, []);

  const isGuestDisabled = useMemo(
    () => !readyDeviceId || isGuestSubmitting,
    [readyDeviceId, isGuestSubmitting]
  );

  const handleGuestContinue = async () => {
    try {
      setIsGuestSubmitting(true);

      const deviceId = getDeviceId() || ensureDeviceId();
      if (!deviceId) {
        toast.error("Failed to get device id");
        return;
      }

      let signedUp = false;

      try {
        const res = await axios({
          method: SummaryApi.signUp.method,
          url: SummaryApi.signUp.url,
          headers: { "Content-Type": "application/json" },
          data: { deviceId },
          withCredentials: true,
        });

        signedUp = !!res?.data?.success;
      } catch {
        // already user থাকলে signUp fail করলেও signIn try করবো
      }

      try {
        const response = await axios({
          method: SummaryApi.signIn.method,
          url: SummaryApi.signIn.url,
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          data: { deviceId },
        });

        if (response?.data?.success) {
          // backend যদি token return করে
          if (response?.data?.data) {
            localStorage.setItem("authToken", response.data.data);
          }

          toast.success("Login successful");
          try {
            await fetchUserDetails?.();
          } catch (e) {
            console.log("fetchUserDetails error", e);
          }

          navigate("/", { replace: true });
          return;
        }

        toast.error(response?.data?.message || "Login failed");
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Something went wrong during login"
        );
      }

      if (!signedUp) {
        toast.error("Guest login failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Guest login error");
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  // ✅ Google Login Success
const handleGoogleSuccess = async (credentialResponse) => {
  try {
    setIsGoogleSubmitting(true);

    const credential = credentialResponse?.credential;

    if (!credential) {
      toast.error("Google credential not found");
      return;
    }

    const response = await axios({
      method: SummaryApi.googleLogin.method,
      url: SummaryApi.googleLogin.url,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
      data: {
        credential,
      },
    });

    if (response?.data?.success) {
      // ✅ old guest token remove
      localStorage.removeItem("authToken");

      toast.success("Google login successful");

      try {
        await fetchUserDetails?.();
      } catch (e) {
        console.log("fetchUserDetails error", e);
      }

      navigate("/", { replace: true });
      return;
    }

    toast.error(response?.data?.message || "Google login failed");
  } catch (error) {
    toast.error(error?.response?.data?.message || "Google login failed");
  } finally {
    setIsGoogleSubmitting(false);
  }
};

  return (
    <div style={styles.page}>
      <div style={styles.cardWrap}>
        <div style={styles.headerWrap}>
          <div style={styles.brand}>Pyzara</div>
          <div style={styles.tagline}>Shop with confidence</div>
        </div>

        <div style={styles.card}>
          <div style={styles.title}>Welcome</div>
          <div style={styles.subText}>
            Continue with Google or as Guest
          </div>

          {/* Google Login */}
          {googleClientId ? (
            <div style={styles.googleWrap}>
              <GoogleOAuthProvider clientId={googleClientId}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  // onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </GoogleOAuthProvider>
            </div>
          ) : (
            <div style={styles.googleError}>
              Google Client ID not found in environment
            </div>
          )}

          <div style={styles.orText}>or</div>

          {/* Guest Button */}
          <button
            style={{
              ...styles.guestBtn,
              ...(isGuestDisabled ? { opacity: 0.6, cursor: "not-allowed" } : {}),
            }}
            onClick={handleGuestContinue}
            disabled={isGuestDisabled || isGoogleSubmitting}
          >
            <div style={styles.guestBtnText}>
              {isGuestSubmitting ? "Logging in..." : "Continue as Guest"}
            </div>
            <div style={styles.guestHint}>
              We’ll create a secure guest session for this device.
            </div>
          </button>
        </div>
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#f7f8fa",
    display: "grid",
    placeItems: "center",
    padding: "16px",
  },
  cardWrap: {
    width: "100%",
    maxWidth: "440px",
  },
  headerWrap: {
    textAlign: "center",
    marginBottom: "12px",
  },
  brand: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#111",
  },
  tagline: {
    marginTop: 4,
    fontSize: "12px",
    color: "#6b7280",
    letterSpacing: ".4px",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,.06)",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#111827",
    textAlign: "center",
  },
  subText: {
    marginTop: "8px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "18px",
  },
  googleWrap: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    marginBottom: "12px",
  },
  googleError: {
    textAlign: "center",
    color: "red",
    fontSize: "13px",
    marginBottom: "12px",
  },
  orText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "12px",
    margin: "10px 0",
  },
  guestBtn: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "14px 16px",
    background: "#fff",
    marginTop: "8px",
  },
  guestBtnText: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: 700,
    color: "#111",
  },
  guestHint: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "12px",
    marginTop: "6px",
  },
};