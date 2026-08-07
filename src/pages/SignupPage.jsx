import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import SummaryApi from "../common/index";
import { ensureDeviceId, getDeviceId } from "../helpers/deviceId";
import Context from "../context";

export default function SignupPage() {
  const navigate = useNavigate();
   const location = useLocation();
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
          } catch {
            console.log();
          }

          const from = location.state?.from || "/";
          navigate(from, { state: location.state?.checkoutState, replace: true });
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
      } catch {
        console.log();
      }

      const from = location.state?.from || "/";
      navigate(from, { state: location.state?.checkoutState, replace: true });
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
      <div style={styles.glowTop} aria-hidden="true" />
      <div style={styles.glowBottom} aria-hidden="true" />
      <div style={styles.cardWrap}>
        <div style={styles.headerWrap}>
          <div style={styles.logoMark} aria-hidden="true">P</div>
          <div style={styles.brand}>PYZARA</div>
          <div style={styles.tagline}>SHOP WITH CONFIDENCE</div>
        </div>

        <div style={styles.card}>
          <div style={styles.eyebrow}>WELCOME TO PYZARA</div>
          <h1 style={styles.title}>Your next find awaits.</h1>
          <div style={styles.subText}>
            Sign in for a personalised experience
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

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.orText}>OR CONTINUE AS</span>
            <span style={styles.dividerLine} />
          </div>

          {/* Guest Button */}
          <button
            style={{
              ...styles.guestBtn,
              ...(isGuestDisabled ? { opacity: 0.6, cursor: "not-allowed" } : {}),
            }}
            onClick={handleGuestContinue}
            disabled={isGuestDisabled || isGoogleSubmitting}
          >
            <div style={styles.guestButtonRow}>
              <div style={styles.guestIcon} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div style={styles.guestCopy}>
                <div style={styles.guestBtnText}>
                  {isGuestSubmitting ? "Logging in..." : "Continue as Guest"}
                </div>
                <div style={styles.guestHint}>
                  No account or password required
                </div>
              </div>
              <span style={styles.arrow} aria-hidden="true">→</span>
            </div>
          </button>

          <div style={styles.securityNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Secure sign-in · Your information stays protected
          </div>
        </div>

        <div style={styles.footerText}>By continuing, you agree to Pyzara’s Terms &amp; Privacy Policy.</div>
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(145deg, #f7f5ef 0%, #ffffff 48%, #f0eee7 100%)",
    display: "grid",
    placeItems: "center",
    padding: "28px 16px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  glowTop: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(190, 157, 82, 0.11)",
    filter: "blur(2px)",
    top: "-260px",
    right: "-150px",
  },
  glowBottom: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    border: "1px solid rgba(156, 124, 54, 0.12)",
    bottom: "-250px",
    left: "-120px",
  },
  cardWrap: {
    width: "100%",
    maxWidth: "460px",
    position: "relative",
    zIndex: 1,
  },
  headerWrap: {
    textAlign: "center",
    marginBottom: "22px",
  },
  logoMark: {
    width: "42px",
    height: "42px",
    margin: "0 auto 10px",
    display: "grid",
    placeItems: "center",
    border: "1px solid #b79a5b",
    borderRadius: "50%",
    color: "#8a6b2d",
    fontFamily: "Georgia, serif",
    fontSize: "22px",
    fontWeight: 600,
  },
  brand: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "24px",
    fontWeight: 600,
    letterSpacing: "6px",
    color: "#171717",
  },
  tagline: {
    marginTop: "7px",
    fontSize: "9px",
    color: "#8b8069",
    letterSpacing: "1.7px",
  },
  card: {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    border: "1px solid rgba(163, 139, 87, 0.2)",
    borderRadius: "24px",
    padding: "34px 32px 28px",
    boxShadow: "0 24px 70px rgba(49, 42, 28, 0.10), 0 2px 10px rgba(49, 42, 28, 0.04)",
    backdropFilter: "blur(12px)",
  },
  eyebrow: {
    textAlign: "center",
    color: "#9a7a39",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.8px",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: 500,
    color: "#1d1b17",
    textAlign: "center",
  },
  subText: {
    margin: "12px auto 24px",
    maxWidth: "340px",
    textAlign: "center",
    color: "#756f65",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  googleWrap: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    minHeight: "44px",
    marginBottom: "2px",
  },
  googleError: {
    textAlign: "center",
    color: "#a33a35",
    fontSize: "13px",
    marginBottom: "12px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0 14px",
  },
  dividerLine: {
    height: "1px",
    flex: 1,
    background: "#ebe7dd",
  },
  orText: {
    color: "#a0998c",
    fontSize: "9px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    whiteSpace: "nowrap",
  },
  guestBtn: {
    width: "100%",
    border: "1px solid #d9d0bc",
    borderRadius: "14px",
    padding: "13px 15px",
    background: "linear-gradient(135deg, #fffdf8, #f8f4e9)",
    marginTop: "4px",
    color: "#25221c",
    boxShadow: "0 5px 16px rgba(86, 69, 31, 0.06)",
  },
  guestButtonRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  guestIcon: {
    width: "38px",
    height: "38px",
    flex: "0 0 38px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#eee5d1",
    color: "#8b6b2f",
  },
  guestCopy: {
    minWidth: 0,
    flex: 1,
  },
  guestBtnText: {
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 650,
    color: "#29251e",
  },
  guestHint: {
    textAlign: "left",
    color: "#8b8375",
    fontSize: "10px",
    marginTop: "3px",
  },
  arrow: {
    color: "#967538",
    fontSize: "20px",
    lineHeight: 1,
  },
  securityNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "20px",
    color: "#938b7d",
    fontSize: "10px",
  },
  footerText: {
    marginTop: "16px",
    padding: "0 16px",
    textAlign: "center",
    color: "#8a8377",
    fontSize: "10px",
    lineHeight: 1.5,
  },
};