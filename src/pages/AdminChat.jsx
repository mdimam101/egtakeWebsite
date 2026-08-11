// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { IoChatbubblesOutline, IoSend, IoSparklesOutline } from "react-icons/io5";
// import SummaryApi from "../common";
// import "../styles/AdminChat.css";

// const authHeaders = (json = false) => {
//   const token = localStorage.getItem("authToken");
//   return {
//     ...(json ? { "Content-Type": "application/json" } : {}),
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };
// };

// const customerName = (conversation) =>
//   conversation?.userId?.name || conversation?.guestDisplayName || "Guest customer";

// const formatDate = (value) => {
//   if (!value) return "";
//   return new Intl.DateTimeFormat("en-BD", {
//     month: "short",
//     day: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//   }).format(new Date(value));
// };

// const AdminChat = () => {
//   const [conversations, setConversations] = useState([]);
//   const [selectedId, setSelectedId] = useState("");
//   const [activeConversation, setActiveConversation] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [status, setStatus] = useState("OPEN");
//   const [unreadOnly, setUnreadOnly] = useState(false);
//   const [draft, setDraft] = useState("");
//   const [loadingList, setLoadingList] = useState(true);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState("");
//   const endRef = useRef(null);

//   const request = useCallback(async (url, options = {}) => {
//     const response = await fetch(url, { credentials: "include", ...options });
//     const result = await response.json().catch(() => ({}));
//     if (!response.ok || result?.success === false) {
//       throw new Error(result?.message || "Chat request failed");
//     }
//     return result;
//   }, []);

//   const loadConversations = useCallback(
//     async (quiet = false) => {
//       if (!quiet) setLoadingList(true);
//       try {
//         const query = new URLSearchParams({ status, page: "1", limit: "50" });
//         if (unreadOnly) query.set("unread", "true");
//         const result = await request(`${SummaryApi.admin_chat_conversations.url}?${query}`, {
//           headers: authHeaders(),
//         });
//         const rows = result.data || [];
//         setConversations(rows);
//         setSelectedId((current) =>
//           rows.some((item) => item._id === current) ? current : rows[0]?._id || "",
//         );
//         setError("");
//       } catch (requestError) {
//         if (!quiet) setError(requestError.message);
//       } finally {
//         if (!quiet) setLoadingList(false);
//       }
//     },
//     [request, status, unreadOnly],
//   );

//   const loadMessages = useCallback(
//     async (conversationId, quiet = false) => {
//       if (!conversationId) return;
//       if (!quiet) setLoadingMessages(true);
//       try {
//         const result = await request(
//           `${SummaryApi.admin_chat_messages.url(conversationId)}?page=1&limit=50`,
//           { headers: authHeaders() },
//         );
//         setActiveConversation(result.data?.conversation || null);
//         setMessages(result.data?.messages || []);
//         setConversations((current) =>
//           current.map((item) =>
//             item._id === conversationId ? { ...item, adminUnreadCount: 0 } : item,
//           ),
//         );
//         setError("");
//       } catch (requestError) {
//         if (!quiet) setError(requestError.message);
//       } finally {
//         if (!quiet) setLoadingMessages(false);
//       }
//     },
//     [request],
//   );

//   useEffect(() => {
//     loadConversations();
//   }, [loadConversations]);

//   useEffect(() => {
//     if (!selectedId) {
//       setActiveConversation(null);
//       setMessages([]);
//       return undefined;
//     }
//     loadMessages(selectedId);
//     return undefined;
//   }, [loadMessages, selectedId]);

//   useEffect(() => {
//     const interval = window.setInterval(() => {
//       loadConversations(true);
//       if (selectedId) loadMessages(selectedId, true);
//     }, 7000);
//     return () => window.clearInterval(interval);
//   }, [loadConversations, loadMessages, selectedId]);

//   useEffect(() => {
//     const websocketUrl = import.meta.env.VITE_CHAT_WEBSOCKET_URL;
//     const token = localStorage.getItem("authToken");
//     if (!websocketUrl || !token) return undefined;
//     const separator = websocketUrl.includes("?") ? "&" : "?";
//     const socket = new WebSocket(
//       `${websocketUrl}${separator}type=ADMIN&token=${encodeURIComponent(token)}`,
//     );
//     socket.onmessage = (event) => {
//       try {
//         const payload = JSON.parse(event.data);
//         if (payload.type !== "NEW_MESSAGE") return;
//         loadConversations(true);
//         if (payload.conversationId === selectedId) loadMessages(selectedId, true);
//       } catch {
//         // Ignore non-JSON WebSocket control messages.
//       }
//     };
//     return () => socket.close();
//   }, [loadConversations, loadMessages, selectedId]);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const selectedSummary = useMemo(
//     () => conversations.find((item) => item._id === selectedId),
//     [conversations, selectedId],
//   );
//   const totalUnread = useMemo(
//     () => conversations.reduce((total, item) => total + Number(item.adminUnreadCount || 0), 0),
//     [conversations],
//   );

//   const sendReply = async (event) => {
//     event.preventDefault();
//     const message = draft.trim();
//     if (!selectedId || !message || message.length > 5000 || sending) return;
//     setSending(true);
//     try {
//       const result = await request(SummaryApi.admin_chat_reply.url, {
//         method: SummaryApi.admin_chat_reply.method.toUpperCase(),
//         headers: authHeaders(true),
//         body: JSON.stringify({ conversationId: selectedId, message }),
//       });
//       setDraft("");
//       if (result.data?.message) setMessages((current) => [...current, result.data.message]);
//       if (result.data?.conversation) setActiveConversation(result.data.conversation);
//       await loadConversations(true);
//     } catch (requestError) {
//       setError(requestError.message);
//     } finally {
//       setSending(false);
//     }
//   };

//   const toggleStatus = async () => {
//     if (!selectedId) return;
//     const nextStatus = activeConversation?.status === "CLOSED" ? "OPEN" : "CLOSED";
//     try {
//       const result = await request(SummaryApi.admin_chat_status.url(selectedId), {
//         method: SummaryApi.admin_chat_status.method,
//         headers: authHeaders(true),
//         body: JSON.stringify({ status: nextStatus }),
//       });
//       setActiveConversation(result.data);
//       await loadConversations(true);
//     } catch (requestError) {
//       setError(requestError.message);
//     }
//   };

//   return (
//     <div className="admin-chat-page">
//       <div className="admin-chat-heading">
//         <div className="admin-chat-title-wrap">
//           <span className="admin-chat-title-icon"><IoSparklesOutline /></span>
//           <div>
//             <p>Customer concierge</p>
//             <h1>Support Inbox</h1>
//             <small>Manage every customer conversation from one place</small>
//           </div>
//         </div>
//         <div className="admin-chat-heading-actions">
//           <span className="admin-chat-unread-summary"><i /> {totalUnread} unread</span>
//           <button type="button" onClick={() => loadConversations()} disabled={loadingList}>
//             {loadingList ? "Loading…" : "Refresh inbox"}
//           </button>
//         </div>
//       </div>

//       {error && <div className="admin-chat-error">{error}</div>}

//       <div className="admin-chat-layout">
//         <aside className="admin-chat-list">
//           <div className="admin-chat-filters">
//             <select value={status} onChange={(event) => setStatus(event.target.value)}>
//               <option value="OPEN">Open</option>
//               <option value="CLOSED">Closed</option>
//             </select>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={unreadOnly}
//                 onChange={(event) => setUnreadOnly(event.target.checked)}
//               />
//               Unread only
//             </label>
//           </div>
//           <div className="admin-chat-conversations">
//             {!loadingList && conversations.length === 0 && (
//               <div className="admin-chat-empty">No {status.toLowerCase()} conversations.</div>
//             )}
//             {conversations.map((item) => (
//               <button
//                 type="button"
//                 key={item._id}
//                 className={item._id === selectedId ? "active" : ""}
//                 onClick={() => setSelectedId(item._id)}
//               >
//                 <span className="admin-chat-avatar">{customerName(item).charAt(0).toUpperCase()}</span>
//                 <span className="admin-chat-preview">
//                   <strong>{customerName(item)}</strong>
//                   <small>{item.lastMessage || "No message"}</small>
//                 </span>
//                 <span className="admin-chat-meta">
//                   <small>{formatDate(item.lastMessageAt)}</small>
//                   {item.adminUnreadCount > 0 && <b>{item.adminUnreadCount}</b>}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </aside>

//         <section className="admin-chat-thread">
//           {!selectedId ? (
//             <div className="admin-chat-placeholder">
//               <IoChatbubblesOutline />
//               <strong>Select a conversation</strong>
//               <span>Customer messages will appear here.</span>
//             </div>
//           ) : (
//             <>
//               <header>
//                 <div>
//                   <strong>{customerName(activeConversation || selectedSummary)}</strong>
//                   <small>
//                     {activeConversation?.userId?.email || activeConversation?.guestId || "Customer"}
//                   </small>
//                 </div>
//                 <button type="button" onClick={toggleStatus}>
//                   {activeConversation?.status === "CLOSED" ? "Reopen" : "Close chat"}
//                 </button>
//               </header>

//               <div className="admin-chat-messages">
//                 {loadingMessages && messages.length === 0 ? (
//                   <div className="admin-chat-empty">Loading messages…</div>
//                 ) : (
//                   messages.map((item) => (
//                     <div
//                       key={item._id}
//                       className={`admin-chat-message ${item.sender === "ADMIN" ? "admin" : "customer"}`}
//                     >
//                       <p>{item.message}</p>
//                       <small>{formatDate(item.createdAt)}</small>
//                     </div>
//                   ))
//                 )}
//                 <div ref={endRef} />
//               </div>

//               <form onSubmit={sendReply}>
//                 <textarea
//                   rows="1"
//                   value={draft}
//                   maxLength="5000"
//                   onChange={(event) => setDraft(event.target.value)}
//                   placeholder="Reply to customer…"
//                   disabled={activeConversation?.status === "CLOSED"}
//                 />
//                 <button
//                   type="submit"
//                   disabled={!draft.trim() || sending || activeConversation?.status === "CLOSED"}
//                   aria-label="Send reply"
//                 >
//                   <IoSend />
//                 </button>
//               </form>
//             </>
//           )}
//         </section>
//       </div>
//     </div>
//   );
// };

// export default AdminChat;



import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  IoChatbubblesOutline,
  IoSend,
  IoSparklesOutline,
} from "react-icons/io5";

import SummaryApi from "../common";
import "../styles/AdminChat.css";

const FALLBACK_POLL_INTERVAL = 10000;
const WEBSOCKET_RECONNECT_DELAY = 3000;

const authHeaders = (json = false) => {
  const token = localStorage.getItem("authToken");

  return {
    ...(json
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

const customerName = (conversation) =>
  conversation?.userId?.name ||
  conversation?.guestDisplayName ||
  "Guest customer";

const formatDate = (value) => {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-BD", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeConversation, setActiveConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [status, setStatus] = useState("OPEN");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [draft, setDraft] = useState("");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  /**
   * WebSocket connection state.
   *
   * true  = realtime active, no polling
   * false = fallback polling active
   */
  const [wsConnected, setWsConnected] = useState(false);

  const endRef = useRef(null);
  const socketRef = useRef(null);

  /**
   * Refs are used by WebSocket so selecting another
   * conversation does not reconnect the socket.
   */
  const selectedIdRef = useRef("");
  const loadConversationsRef = useRef(null);
  const loadMessagesRef = useRef(null);

  const authToken = localStorage.getItem("authToken");

  /**
   * Generic API request
   */
  const request = useCallback(async (url, options = {}) => {
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
      throw new Error(
        result?.message || "Chat request failed",
      );
    }

    return result;
  }, []);

  /**
   * Load admin conversation list
   */
  const loadConversations = useCallback(
    async (quiet = false) => {
      if (!quiet) {
        setLoadingList(true);
      }

      try {
        const query = new URLSearchParams({
          status,
          page: "1",
          limit: "50",
        });

        if (unreadOnly) {
          query.set("unread", "true");
        }

        const result = await request(
          `${SummaryApi.admin_chat_conversations.url}?${query.toString()}`,
          {
            headers: authHeaders(),
          },
        );

        const rows = result.data || [];

        setConversations(rows);

        /**
         * Keep currently selected conversation
         * if it still exists in the current filter.
         *
         * Otherwise select first available conversation.
         */
        setSelectedId((current) =>
          rows.some(
            (item) => item._id === current,
          )
            ? current
            : rows[0]?._id || "",
        );

        setError("");
      } catch (requestError) {
        if (!quiet) {
          setError(requestError.message);
        }
      } finally {
        if (!quiet) {
          setLoadingList(false);
        }
      }
    },
    [request, status, unreadOnly],
  );

  /**
   * Load messages for selected conversation.
   *
   * Backend currently handles admin read state
   * when messages are opened.
   */
  const loadMessages = useCallback(
    async (
      conversationId,
      quiet = false,
    ) => {
      if (!conversationId) return;

      if (!quiet) {
        setLoadingMessages(true);
      }

      try {
        const result = await request(
          `${SummaryApi.admin_chat_messages.url(
            conversationId,
          )}?page=1&limit=50`,
          {
            headers: authHeaders(),
          },
        );

        setActiveConversation(
          result.data?.conversation || null,
        );

        setMessages(
          result.data?.messages || [],
        );

        /**
         * Conversation is open in admin UI,
         * so local unread count becomes zero.
         */
        setConversations((current) =>
          current.map((item) =>
            item._id === conversationId
              ? {
                  ...item,
                  adminUnreadCount: 0,
                }
              : item,
          ),
        );

        setError("");
      } catch (requestError) {
        if (!quiet) {
          setError(requestError.message);
        }
      } finally {
        if (!quiet) {
          setLoadingMessages(false);
        }
      }
    },
    [request],
  );

  /**
   * Keep latest values available for
   * WebSocket event handler without reconnecting.
   */
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    loadConversationsRef.current =
      loadConversations;
  }, [loadConversations]);

  useEffect(() => {
    loadMessagesRef.current =
      loadMessages;
  }, [loadMessages]);

  /**
   * Initial conversation list load
   *
   * Also runs when OPEN/CLOSED or
   * unread filter changes.
   */
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Load selected conversation
   */
  useEffect(() => {
    if (!selectedId) {
      setActiveConversation(null);
      setMessages([]);

      return;
    }

    loadMessages(selectedId);
  }, [loadMessages, selectedId]);

  /**
   * WebSocket connection
   *
   * IMPORTANT:
   * This does NOT reconnect just because
   * admin selects another conversation.
   */
  useEffect(() => {
    const websocketUrl =
      import.meta.env.VITE_CHAT_WEBSOCKET_URL;

    const token =
      localStorage.getItem("authToken");


    console.log("token111", token, websocketUrl);
    

    /**
     * If WebSocket is not configured,
     * REST polling will work as fallback.
     */
    if (!websocketUrl || !token) {
      setWsConnected(false);

      return undefined;
    }

    let destroyed = false;
    let reconnectTimer = null;

    const connectWebSocket = () => {
      if (destroyed) return;

      const currentToken =
        localStorage.getItem("authToken");

      if (!currentToken) {
        setWsConnected(false);
        return;
      }

      const separator =
        websocketUrl.includes("?")
          ? "&"
          : "?";

      const socket = new WebSocket(
        `${websocketUrl}${separator}type=ADMIN&token=${encodeURIComponent(
          currentToken,
        )}`,
      );

      socketRef.current = socket;

      socket.onopen = () => {
        if (destroyed) return;

        console.log(
          "[AdminChat] WebSocket connected",
        );

        setWsConnected(true);
      };

socket.onmessage = async (event) => {
  if (destroyed) return;

  try {
    const payload = JSON.parse(event.data);

    console.log(
      "[AdminChat] WS MESSAGE:",
      payload
    );

    if (payload?.type !== "NEW_MESSAGE") {
      return;
    }

    const currentSelectedId =
      selectedIdRef.current;

    /**
     * Selected conversation-এ নতুন message এলে
     * message payload থাকুক বা না থাকুক
     * thread refresh করবো।
     */
    if (
      payload.conversationId &&
      payload.conversationId === currentSelectedId
    ) {
      /**
       * Backend message object পাঠালে
       * immediately UI-তে add করি।
       */
      if (payload.message) {
        setMessages((current) => {
          const exists = current.some(
            (item) =>
              item._id === payload.message._id
          );

          if (exists) {
            return current;
          }

          return [
            ...current,
            payload.message,
          ];
        });
      }

      /**
       * Always fetch latest messages.
       * payload.message না থাকলেও নতুন message
       * সাথে সাথে চলে আসবে।
       */
      if (loadMessagesRef.current) {
        await loadMessagesRef.current(
          currentSelectedId,
          true
        );
      }

      /**
       * Update last message / unread / ordering.
       */
      if (loadConversationsRef.current) {
        await loadConversationsRef.current(
          true
        );
      }

      return;
    }

    /**
     * অন্য customer message করলে
     * শুধু inbox list update হবে।
     */
    if (loadConversationsRef.current) {
      await loadConversationsRef.current(
        true
      );
    }
  } catch (error) {
    console.error(
      "[AdminChat] WebSocket message error:",
      error
    );
  }
};

      socket.onerror = () => {
        if (destroyed) return;

        console.warn(
          "[AdminChat] WebSocket connection error",
        );

        setWsConnected(false);

        /**
         * Closing causes onclose,
         * which schedules reconnect.
         */
        try {
          socket.close();
        } catch {
          // Ignore close error.
        }
      };

      socket.onclose = () => {
        if (
          socketRef.current === socket
        ) {
          socketRef.current = null;
        }

        if (destroyed) return;

        console.log(
          "[AdminChat] WebSocket disconnected",
        );

        setWsConnected(false);

        reconnectTimer =
          window.setTimeout(
            () => {
              connectWebSocket();
            },
            WEBSOCKET_RECONNECT_DELAY,
          );
      };
    };

    setWsConnected(false);

    connectWebSocket();

    return () => {
      destroyed = true;

      if (reconnectTimer) {
        window.clearTimeout(
          reconnectTimer,
        );
      }

      const socket =
        socketRef.current;

      if (
        socket &&
        (socket.readyState ===
          WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING)
      ) {
        try {
          socket.close();
        } catch {
          // Ignore cleanup error.
        }
      }

      socketRef.current = null;
    };
  }, [authToken]);


  /**
   * FALLBACK POLLING
   *
   * WebSocket connected:
   *   NO polling
   *
   * WebSocket missing/disconnected:
   *   poll every 10 seconds
   */
  useEffect(() => {
    if (wsConnected) {
      return undefined;
    }

    const interval =
      window.setInterval(() => {
        loadConversations(true);

        const currentSelectedId =
          selectedIdRef.current;

        if (currentSelectedId) {
          loadMessages(
            currentSelectedId,
            true,
          );
        }
      }, FALLBACK_POLL_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    loadConversations,
    loadMessages,
    wsConnected,
  ]);

  /**
   * Auto scroll to latest message
   */
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /**
   * Currently selected conversation summary
   */
  const selectedSummary = useMemo(
    () =>
      conversations.find(
        (item) =>
          item._id === selectedId,
      ),
    [conversations, selectedId],
  );

  /**
   * Total unread in currently loaded list
   */
  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, item) =>
          total +
          Number(
            item.adminUnreadCount || 0,
          ),
        0,
      ),
    [conversations],
  );

  /**
   * Admin reply
   */
  const sendReply = async (event) => {
    event.preventDefault();

    const message = draft.trim();

    if (
      !selectedId ||
      !message ||
      message.length > 5000 ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const result = await request(
        SummaryApi.admin_chat_reply.url,
        {
          method:
            SummaryApi.admin_chat_reply.method.toUpperCase(),

          headers: authHeaders(true),

          body: JSON.stringify({
            conversationId:
              selectedId,
            message,
          }),
        },
      );

      setDraft("");

      const savedMessage =
        result.data?.message;

      if (savedMessage) {
        setMessages((current) => {
          const exists =
            current.some(
              (item) =>
                item._id ===
                savedMessage._id,
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            savedMessage,
          ];
        });
      }

      if (
        result.data?.conversation
      ) {
        setActiveConversation(
          result.data.conversation,
        );
      }

      /**
       * One refresh after reply is fine.
       *
       * This updates lastMessage,
       * lastMessageAt and list ordering.
       */
      await loadConversations(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  /**
   * Close / reopen conversation
   */
  const toggleStatus = async () => {
    if (!selectedId) return;

    const nextStatus =
      activeConversation?.status ===
      "CLOSED"
        ? "OPEN"
        : "CLOSED";

    setError("");

    try {
      const result = await request(
        SummaryApi.admin_chat_status.url(
          selectedId,
        ),
        {
          method:
            SummaryApi.admin_chat_status.method.toUpperCase(),

          headers: authHeaders(true),

          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      setActiveConversation(
        result.data || null,
      );

      /**
       * Current conversation may disappear
       * from OPEN/CLOSED filtered list.
       */
      await loadConversations(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="admin-chat-page">
      <div className="admin-chat-heading">
        <div className="admin-chat-title-wrap">
          <span className="admin-chat-title-icon">
            <IoSparklesOutline />
          </span>

          <div>
            <p>Customer concierge</p>

            <h1>Support Inbox</h1>

            <small>
              Manage every customer
              conversation from one place
            </small>
          </div>
        </div>

        <div className="admin-chat-heading-actions">
          <span className="admin-chat-unread-summary">
            <i /> {totalUnread} unread
          </span>

          <button
            type="button"
            onClick={() =>
              loadConversations()
            }
            disabled={loadingList}
          >
            {loadingList
              ? "Loading…"
              : "Refresh inbox"}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-chat-error">
          {error}
        </div>
      )}

      <div className="admin-chat-layout">
        <aside className="admin-chat-list">
          <div className="admin-chat-filters">
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
            >
              <option value="OPEN">
                Open
              </option>

              <option value="CLOSED">
                Closed
              </option>
            </select>

            <label>
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) =>
                  setUnreadOnly(
                    event.target.checked,
                  )
                }
              />

              Unread only
            </label>
          </div>

          <div className="admin-chat-conversations">
            {!loadingList &&
              conversations.length ===
                0 && (
                <div className="admin-chat-empty">
                  No{" "}
                  {status.toLowerCase()}{" "}
                  conversations.
                </div>
              )}

            {conversations.map(
              (item) => (
                <button
                  type="button"
                  key={item._id}
                  className={
                    item._id ===
                    selectedId
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedId(
                      item._id,
                    )
                  }
                >
                  <span className="admin-chat-avatar">
                    {customerName(
                      item,
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span className="admin-chat-preview">
                    <strong>
                      {customerName(
                        item,
                      )}
                    </strong>

                    <small>
                      {item.lastMessage ||
                        "No message"}
                    </small>
                  </span>

                  <span className="admin-chat-meta">
                    <small>
                      {formatDate(
                        item.lastMessageAt,
                      )}
                    </small>

                    {item.adminUnreadCount >
                      0 && (
                      <b>
                        {
                          item.adminUnreadCount
                        }
                      </b>
                    )}
                  </span>
                </button>
              ),
            )}
          </div>
        </aside>

        <section className="admin-chat-thread">
          {!selectedId ? (
            <div className="admin-chat-placeholder">
              <IoChatbubblesOutline />

              <strong>
                Select a conversation
              </strong>

              <span>
                Customer messages will
                appear here.
              </span>
            </div>
          ) : (
            <>
              <header>
                <div>
                  <strong>
                    {customerName(
                      activeConversation ||
                        selectedSummary,
                    )}
                  </strong>

                  <small>
                    {activeConversation
                      ?.userId?.email ||
                      activeConversation
                        ?.guestId ||
                      "Customer"}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={toggleStatus}
                >
                  {activeConversation
                    ?.status ===
                  "CLOSED"
                    ? "Reopen"
                    : "Close chat"}
                </button>
              </header>

              <div className="admin-chat-messages">
                {loadingMessages &&
                messages.length ===
                  0 ? (
                  <div className="admin-chat-empty">
                    Loading messages…
                  </div>
                ) : (
                  messages.map(
                    (item) => (
                      <div
                        key={
                          item._id
                        }
                        className={`admin-chat-message ${
                          item.sender ===
                          "ADMIN"
                            ? "admin"
                            : "customer"
                        }`}
                      >
                        <p>
                          {
                            item.message
                          }
                        </p>

                        <small>
                          {formatDate(
                            item.createdAt,
                          )}
                        </small>
                      </div>
                    ),
                  )
                )}

                <div ref={endRef} />
              </div>

              <form
                onSubmit={sendReply}
              >
                <textarea
                  rows={1}
                  value={draft}
                  maxLength={5000}
                  onChange={(event) =>
                    setDraft(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Reply to customer…"
                  disabled={
                    activeConversation
                      ?.status ===
                    "CLOSED"
                  }
                />

                <button
                  type="submit"
                  disabled={
                    !draft.trim() ||
                    sending ||
                    activeConversation
                      ?.status ===
                      "CLOSED"
                  }
                  aria-label="Send reply"
                >
                  <IoSend />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminChat;
