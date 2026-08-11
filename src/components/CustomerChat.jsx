// import { useCallback, useEffect, useRef, useState } from "react";
// import {
//   IoChatbubbleEllipsesOutline,
//   IoClose,
//   IoSend,
//   IoShieldCheckmarkOutline,
// } from "react-icons/io5";
// import SummaryApi, { backendDomain } from "../common";
// import { ensureChatGuestId } from "../helpers/deviceId";
// import "../styles/CustomerChat.css";

// const requestHeaders = (withJson = false) => {
//   const token = localStorage.getItem("authToken");
//   return {
//     ...(withJson ? { "Content-Type": "application/json" } : {}),
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };
// };

// const formatTime = (value) =>
//   value
//     ? new Intl.DateTimeFormat("en-BD", { hour: "numeric", minute: "2-digit" }).format(
//         new Date(value),
//       )
//     : "";

// const customerChatApi = {
//   message: SummaryApi.chat_message || { url: `${backendDomain}/api/chat/message`, method: "post" },
//   conversation: SummaryApi.chat_conversation || {
//     url: `${backendDomain}/api/chat/conversation`,
//     method: "get",
//   },
//   messages: SummaryApi.chat_messages || {
//     url: (conversationId) => `${backendDomain}/api/chat/messages/${conversationId}`,
//     method: "get",
//   },
//   read: SummaryApi.chat_read || {
//     url: (conversationId) => `${backendDomain}/api/chat/read/${conversationId}`,
//     method: "PATCH",
//   },
// };

// const CustomerChat = ({ productName }) => {
//   const [open, setOpen] = useState(false);
//   const [conversation, setConversation] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [draft, setDraft] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState("");
//   const endRef = useRef(null);
//   const guestId = useRef(ensureChatGuestId()).current;

//   const isLoggedIn = Boolean(localStorage.getItem("authToken"));

//   const apiRequest = useCallback(async (url, options = {}) => {
//     if (!url) throw new Error("Chat API URL is not configured. Please refresh the website.");
//     const response = await fetch(url, { credentials: "include", ...options });
//     const result = await response.json().catch(() => ({}));
//     if (!response.ok || result?.success === false) {
//       throw new Error(result?.message || "Chat request failed");
//     }
//     return result;
//   }, []);

//   const markRead = useCallback(
//     async (conversationId) => {
//       const suffix = isLoggedIn ? "" : `?guestId=${encodeURIComponent(guestId)}`;
//       await apiRequest(`${customerChatApi.read.url(conversationId)}${suffix}`, {
//         method: customerChatApi.read.method,
//         headers: requestHeaders(),
//       });
//     },
//     [apiRequest, guestId, isLoggedIn],
//   );

//   const loadMessages = useCallback(
//     async (activeConversation, quiet = false) => {
//       if (!activeConversation?._id) return;
//       if (!quiet) setLoading(true);
//       try {
//         const query = new URLSearchParams({ page: "1", limit: "50" });
//         if (!isLoggedIn) query.set("guestId", guestId);
//         const result = await apiRequest(
//           `${customerChatApi.messages.url(activeConversation._id)}?${query}`,
//           { headers: requestHeaders() },
//         );
//         setConversation(result.data?.conversation || activeConversation);
//         setMessages(result.data?.messages || []);
//         await markRead(activeConversation._id);
//         setError("");
//       } catch (requestError) {
//         if (!quiet) setError(requestError.message);
//       } finally {
//         if (!quiet) setLoading(false);
//       }
//     },
//     [apiRequest, guestId, isLoggedIn, markRead],
//   );

//   const loadConversation = useCallback(async () => {
//     setLoading(true);
//     try {
//       const suffix = isLoggedIn ? "" : `?guestId=${encodeURIComponent(guestId)}`;
//       const result = await apiRequest(`${customerChatApi.conversation.url}${suffix}`, {
//         headers: requestHeaders(),
//       });
//       setConversation(result.data || null);
//       if (result.data) await loadMessages(result.data);
//       else setMessages([]);
//       setError("");
//     } catch (requestError) {
//       setError(requestError.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [apiRequest, guestId, isLoggedIn, loadMessages]);

//   useEffect(() => {
//     if (!open) return undefined;
//     loadConversation();
//     return undefined;
//   }, [loadConversation, open]);

//   useEffect(() => {
//     if (!open || !conversation?._id) return undefined;
//     const interval = window.setInterval(() => {
//       loadMessages(conversation, true);
//     }, 8000);
//     return () => window.clearInterval(interval);
//   }, [conversation, loadConversation, loadMessages, open]);

//   useEffect(() => {
//     const websocketUrl = import.meta.env.VITE_CHAT_WEBSOCKET_URL;
//     if (!open || !websocketUrl) return undefined;
//     const token = localStorage.getItem("authToken");
//     const query = token
//       ? `type=USER&token=${encodeURIComponent(token)}`
//       : `type=GUEST&guestId=${encodeURIComponent(guestId)}`;
//     const socket = new WebSocket(`${websocketUrl}${websocketUrl.includes("?") ? "&" : "?"}${query}`);
//     socket.onmessage = (event) => {
//       try {
//         const payload = JSON.parse(event.data);
//         if (payload.type !== "ADMIN_REPLY" || !payload.message) return;
//         setMessages((current) =>
//           current.some((item) => item._id === payload.message._id)
//             ? current
//             : [...current, payload.message],
//         );
//         if (payload.conversationId) markRead(payload.conversationId).catch(() => {});
//       } catch {
//         // Ignore non-JSON WebSocket control messages.
//       }
//     };
//     return () => socket.close();
//   }, [guestId, markRead, open]);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, open]);

//   const sendMessage = async (event) => {
//     event.preventDefault();
//     const message = draft.trim();
//     if (!message || message.length > 5000 || sending) return;
//     setSending(true);
//     setError("");
//     try {
//       const endpoint = customerChatApi.message;
//       const result = await apiRequest(endpoint.url, {
//         method: endpoint.method.toUpperCase(),
//         headers: requestHeaders(true),
//         body: JSON.stringify({
//           message,
//           ...(!isLoggedIn || guestId ? { guestId } : {}),
//         }),
//       });
//       setDraft("");
//       setConversation(result.data?.conversation || conversation);
//       if (result.data?.message) {
//         setMessages((current) => [...current, result.data.message]);
//       }
//     } catch (requestError) {
//       setError(requestError.message);
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div className="customer-chat">
//       <button
//         type="button"
//         className="customer-chat-trigger"
//         onClick={() => setOpen((value) => !value)}
//         aria-label={open ? "Close support chat" : "Chat about this product"}
//       >
//         {open ? <IoClose /> : <IoChatbubbleEllipsesOutline />}
//         <span>Chat</span>
//         {conversation?.userUnreadCount > 0 && (
//           <b className="customer-chat-unread">{conversation.userUnreadCount}</b>
//         )}
//       </button>

//       {open && (
//         <section className="customer-chat-panel" aria-label="Customer support chat">
//           <header>
//             <div className="customer-chat-agent">
//               <span className="customer-chat-agent-avatar">
//                 <IoShieldCheckmarkOutline />
//                 <i aria-hidden="true" />
//               </span>
//               <div>
//                 <strong>Pyzara Concierge</strong>
//                 <small><i aria-hidden="true" /> Online support</small>
//               </div>
//             </div>
//             <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
//               <IoClose />
//             </button>
//           </header>

//           <div className="customer-chat-product">About: {productName || "this product"}</div>
//           <div className="customer-chat-messages">
//             {loading && messages.length === 0 ? (
//               <p className="customer-chat-state">Loading conversation…</p>
//             ) : messages.length === 0 ? (
//               <p className="customer-chat-state">Hi! কীভাবে সাহায্য করতে পারি?</p>
//             ) : (
//               messages.map((item) => (
//                 <div
//                   className={`customer-chat-message ${item.sender === "USER" ? "customer" : "support"}`}
//                   key={item._id}
//                 >
//                   <p>{item.message}</p>
//                   <small>{formatTime(item.createdAt)}</small>
//                 </div>
//               ))
//             )}
//             <div ref={endRef} />
//           </div>

//           {conversation?.status === "CLOSED" ? (
//             <div className="customer-chat-closed">This conversation is closed. Send a message to start a new chat.</div>
//           ) : null}
//           {error && <div className="customer-chat-error">{error}</div>}
//           <form onSubmit={sendMessage}>
//             <textarea
//               value={draft}
//               onChange={(event) => setDraft(event.target.value.slice(0, 5000))}
//               placeholder="Type your message…"
//               rows="1"
//               aria-label="Chat message"
//             />
//             <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message">
//               <IoSend />
//             </button>
//           </form>
//         </section>
//       )}
//     </div>
//   );
// };

// export default CustomerChat;
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IoChatbubbleEllipsesOutline,
  IoClose,
  IoSend,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

import SummaryApi, { backendDomain } from "../common";
import { ensureChatGuestId } from "../helpers/deviceId";
import "../styles/CustomerChat.css";

const FALLBACK_POLL_INTERVAL = 10000;
const WEBSOCKET_RECONNECT_DELAY = 3000;

const requestHeaders = (withJson = false) => {
  const token = localStorage.getItem("authToken");

  return {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const formatTime = (value) => {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-BD", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const customerChatApi = {
  message: SummaryApi.chat_message || {
    url: `${backendDomain}/api/chat/message`,
    method: "post",
  },

  conversation: SummaryApi.chat_conversation || {
    url: `${backendDomain}/api/chat/conversation`,
    method: "get",
  },

  messages: SummaryApi.chat_messages || {
    url: (conversationId) =>
      `${backendDomain}/api/chat/messages/${conversationId}`,
    method: "get",
  },

  read: SummaryApi.chat_read || {
    url: (conversationId) =>
      `${backendDomain}/api/chat/read/${conversationId}`,
    method: "PATCH",
  },
};

const CustomerChat = ({ productName }) => {
  const [open, setOpen] = useState(false);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [draft, setDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  // WebSocket status
  const [wsConnected, setWsConnected] = useState(false);

  const endRef = useRef(null);
  const socketRef = useRef(null);

  const guestId = useRef(ensureChatGuestId()).current;

  const authToken = localStorage.getItem("authToken");
  const isLoggedIn = Boolean(authToken);

  /**
   * Generic API request
   */
  const apiRequest = useCallback(async (url, options = {}) => {
    if (!url) {
      throw new Error(
        "Chat API URL is not configured. Please refresh the website.",
      );
    }

    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Chat request failed");
    }

    return result;
  }, []);

  /**
   * Mark ADMIN messages as read
   */
  const markRead = useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      const suffix = isLoggedIn
        ? ""
        : `?guestId=${encodeURIComponent(guestId)}`;

      await apiRequest(
        `${customerChatApi.read.url(conversationId)}${suffix}`,
        {
          method: customerChatApi.read.method,
          headers: requestHeaders(),
        },
      );
    },
    [apiRequest, guestId, isLoggedIn],
  );

  /**
   * Load messages
   */
  const loadMessages = useCallback(
    async (activeConversation, quiet = false) => {
      if (!activeConversation?._id) return;

      if (!quiet) {
        setLoading(true);
      }

      try {
        const query = new URLSearchParams({
          page: "1",
          limit: "50",
        });

        if (!isLoggedIn) {
          query.set("guestId", guestId);
        }

        const result = await apiRequest(
          `${customerChatApi.messages.url(
            activeConversation._id,
          )}?${query.toString()}`,
          {
            headers: requestHeaders(),
          },
        );

        const nextConversation =
          result.data?.conversation || activeConversation;

        const nextMessages = result.data?.messages || [];

        setConversation(nextConversation);
        setMessages(nextMessages);

        /**
         * শুধু unread ADMIN message থাকলেই
         * markRead API call হবে।
         */
        if (nextConversation?.userUnreadCount > 0) {
          try {
            await markRead(nextConversation._id);

            setConversation((current) =>
              current?._id === nextConversation._id
                ? {
                    ...current,
                    userUnreadCount: 0,
                  }
                : current,
            );
          } catch {
            // Message load successful.
            // markRead failure should not break chat.
          }
        }

        setError("");
      } catch (requestError) {
        if (!quiet) {
          setError(requestError.message);
        }
      } finally {
        if (!quiet) {
          setLoading(false);
        }
      }
    },
    [apiRequest, guestId, isLoggedIn, markRead],
  );

  /**
   * Load current conversation
   */
  const loadConversation = useCallback(async () => {
    setLoading(true);

    try {
      const suffix = isLoggedIn
        ? ""
        : `?guestId=${encodeURIComponent(guestId)}`;

      const result = await apiRequest(
        `${customerChatApi.conversation.url}${suffix}`,
        {
          headers: requestHeaders(),
        },
      );

      const activeConversation = result.data || null;

      setConversation(activeConversation);

      if (activeConversation?._id) {
        // loadConversation already controls loading,
        // so load messages quietly.
        await loadMessages(activeConversation, true);
      } else {
        setMessages([]);
      }

      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [
    apiRequest,
    guestId,
    isLoggedIn,
    loadMessages,
  ]);

  /**
   * Load conversation when chat opens
   */
  useEffect(() => {
    if (!open) return;

    loadConversation();
  }, [open, loadConversation]);

  /**
   * WebSocket
   *
   * - Connect when chat is open
   * - Reconnect if connection drops
   * - Receive ADMIN_REPLY instantly
   */
  useEffect(() => {
    const websocketUrl =
      import.meta.env.VITE_CHAT_WEBSOCKET_URL;

    if (!open || !websocketUrl) {
      setWsConnected(false);
      return undefined;
    }

    let destroyed = false;
    let reconnectTimer = null;

    const connectWebSocket = () => {
      if (destroyed) return;

      const token = localStorage.getItem("authToken");

      const query = token
        ? `type=USER&token=${encodeURIComponent(token)}`
        : `type=GUEST&guestId=${encodeURIComponent(guestId)}`;

      const separator = websocketUrl.includes("?")
        ? "&"
        : "?";

      const socket = new WebSocket(
        `${websocketUrl}${separator}${query}`,
      );

      socketRef.current = socket;

      socket.onopen = () => {
        if (destroyed) return;

        console.log("[Chat] WebSocket connected");

        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        if (destroyed) return;

        try {
          const payload = JSON.parse(event.data);

          if (
            payload?.type !== "ADMIN_REPLY" ||
            !payload?.message
          ) {
            return;
          }

          /**
           * Prevent duplicate messages
           */
          setMessages((current) => {
            const alreadyExists = current.some(
              (item) =>
                item._id === payload.message._id,
            );

            if (alreadyExists) {
              return current;
            }

            return [
              ...current,
              payload.message,
            ];
          });

          /**
           * Update current conversation
           */
          setConversation((current) => {
            if (!current) return current;

            if (
              payload.conversationId &&
              current._id !== payload.conversationId
            ) {
              return current;
            }

            return {
              ...current,
              lastMessage:
                payload.message.message ||
                current.lastMessage,

              lastMessageAt:
                payload.message.createdAt ||
                new Date().toISOString(),

              userUnreadCount: 0,
            };
          });

          /**
           * Chat is currently open,
           * so received ADMIN message can immediately
           * be marked as read.
           */
          if (payload.conversationId) {
            markRead(
              payload.conversationId,
            ).catch(() => {});
          }
        } catch {
          // Ignore invalid/non JSON WebSocket messages.
        }
      };

      socket.onerror = () => {
        if (destroyed) return;

        console.warn(
          "[Chat] WebSocket connection error",
        );

        setWsConnected(false);
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (destroyed) return;

        console.log(
          "[Chat] WebSocket disconnected",
        );

        setWsConnected(false);

        /**
         * Try reconnecting.
         * REST polling will work while WS is down.
         */
        reconnectTimer = window.setTimeout(
          () => {
            connectWebSocket();
          },
          WEBSOCKET_RECONNECT_DELAY,
        );
      };
    };

    // Until socket.onopen fires,
    // fallback polling is allowed.
    setWsConnected(false);

    connectWebSocket();

    return () => {
      destroyed = true;

      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }

      const socket = socketRef.current;

      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING)
      ) {
        socket.close();
      }

      socketRef.current = null;
    };
  }, [
    authToken,
    guestId,
    markRead,
    open,
  ]);

  /**
   * FALLBACK POLLING
   *
   * IMPORTANT:
   *
   * WebSocket connected
   * => NO polling
   *
   * WebSocket unavailable/disconnected
   * => poll every 10 seconds
   */
  useEffect(() => {
    const conversationId = conversation?._id;

    if (
      !open ||
      !conversationId ||
      wsConnected
    ) {
      return undefined;
    }

    const interval = window.setInterval(
      () => {
        loadMessages(
          {
            _id: conversationId,
          },
          true,
        );
      },
      FALLBACK_POLL_INTERVAL,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    conversation?._id,
    loadMessages,
    open,
    wsConnected,
  ]);

  /**
   * Auto-scroll
   */
  useEffect(() => {
    if (!open) return;

    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, open]);

  /**
   * Send customer message
   */
  const sendMessage = async (event) => {
    event.preventDefault();

    const message = draft.trim();

    if (
      !message ||
      message.length > 5000 ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const endpoint =
        customerChatApi.message;

      const result = await apiRequest(
        endpoint.url,
        {
          method:
            endpoint.method.toUpperCase(),

          headers:
            requestHeaders(true),

          body: JSON.stringify({
            message,

            /**
             * Always sending guestId is useful.
             *
             * If logged-in user originally had
             * a guest conversation, backend can
             * migrate/attach it to req.userId.
             */
            guestId,
          }),
        },
      );

      const nextConversation =
        result.data?.conversation || null;

      const savedMessage =
        result.data?.message || null;

      /**
       * Important:
       *
       * If previous conversation was CLOSED,
       * backend may create a NEW conversation.
       *
       * Do not mix old messages with new chat.
       */
      const conversationChanged =
        conversation?._id &&
        nextConversation?._id &&
        conversation._id !==
          nextConversation._id;

      if (conversationChanged) {
        setMessages(
          savedMessage
            ? [savedMessage]
            : [],
        );
      } else if (savedMessage) {
        setMessages((current) => {
          const alreadyExists =
            current.some(
              (item) =>
                item._id ===
                savedMessage._id,
            );

          if (alreadyExists) {
            return current;
          }

          return [
            ...current,
            savedMessage,
          ];
        });
      }

      if (nextConversation) {
        setConversation(
          nextConversation,
        );
      }

      setDraft("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="customer-chat">
      <button
        type="button"
        className="customer-chat-trigger"
        onClick={() =>
          setOpen((value) => !value)
        }
        aria-label={
          open
            ? "Close support chat"
            : "Chat about this product"
        }
      >
        {open ? (
          <IoClose />
        ) : (
          <IoChatbubbleEllipsesOutline />
        )}

        <span>Chat</span>

        {!open &&
          conversation?.userUnreadCount >
            0 && (
            <span className="customer-chat-unread">
              {
                conversation.userUnreadCount
              }
            </span>
          )}
      </button>

      {open && (
        <section
          className="customer-chat-panel"
          aria-label="Customer support chat"
        >
          <header>
            <div className="customer-chat-agent">
              <span className="customer-chat-agent-avatar">
                <IoShieldCheckmarkOutline />

                <i aria-hidden="true" />
              </span>

              <div>
                <strong>
                  Pyzara Concierge
                </strong>

                <small>
                  <i aria-hidden="true" />
                  Online support
                </small>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              aria-label="Close chat"
            >
              <IoClose />
            </button>
          </header>

          <div className="customer-chat-product">
            About:{" "}
            {productName ||
              "this product"}
          </div>

          <div className="customer-chat-messages">
            {loading &&
            messages.length === 0 ? (
              <p className="customer-chat-state">
                Loading conversation…
              </p>
            ) : messages.length ===
              0 ? (
              <p className="customer-chat-state">
                Hi! কীভাবে সাহায্য করতে পারি?
              </p>
            ) : (
              messages.map((item) => (
                <div
                  key={item._id}
                  className={`customer-chat-message ${
                    item.sender ===
                    "USER"
                      ? "customer"
                      : "support"
                  }`}
                >
                  <p>{item.message}</p>

                  <small>
                    {formatTime(
                      item.createdAt,
                    )}
                  </small>
                </div>
              ))
            )}

            <div ref={endRef} />
          </div>

          {conversation?.status ===
            "CLOSED" && (
            <div className="customer-chat-closed">
              This conversation is
              closed. Send a message to
              start a new chat.
            </div>
          )}

          {error && (
            <div className="customer-chat-error">
              {error}
            </div>
          )}

          <form onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(event) =>
                setDraft(
                  event.target.value.slice(
                    0,
                    5000,
                  ),
                )
              }
              placeholder="Type your message…"
              rows={1}
              aria-label="Chat message"
            />

            <button
              type="submit"
              disabled={
                !draft.trim() ||
                sending
              }
              aria-label="Send message"
            >
              <IoSend />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default CustomerChat;