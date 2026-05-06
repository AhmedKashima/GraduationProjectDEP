// Общий компонент чата (виджет/страница) с поддержкой разговоров, счетчиков и печати
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import useSocket from "../useSocket";

interface Message {
  sender_id: string;
  content: string;
  timestamp: string;
  conversation_id: number;
}

interface ConversationItem {
  conversation_id: number;
  other_user: { id: number; name: string; email?: string };
  last_message: { content: string | null; timestamp: string | null };
  unread_count: number;
}

const ChatPanel = ({
  userId,
  recipientId,
  token,
  isAdmin,
  compact,
  showHeader = true,
}: {
  userId: string | number;
  recipientId: string | null;
  token: string;
  isAdmin: boolean;
  compact?: boolean;
  showHeader?: boolean;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const socket = useSocket("http://127.0.0.1:3000", userId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentRecipientId, setCurrentRecipientId] = useState<string | null>(recipientId);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [team, setTeam] = useState<{ id: number; name: string }[]>([]);
  const [admins, setAdmins] = useState<{ id: number; name: string; email?: string }[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [newRecipientId, setNewRecipientId] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const isOwnMessage = (msg: Message) => Number(msg.sender_id) === Number(userId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = () => {
    if (!userId) return;
    axios
      .get(`http://127.0.0.1:3000/api/conversations/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const sorted = (response.data || []).sort(
          (a: ConversationItem, b: ConversationItem) => {
            const aTime = a.last_message?.timestamp
              ? new Date(a.last_message.timestamp).getTime()
              : 0;
            const bTime = b.last_message?.timestamp
              ? new Date(b.last_message.timestamp).getTime()
              : 0;
            return bTime - aTime;
          }
        );
        setConversations(sorted);
      })
      .catch((error) => console.error("Ошибка при загрузке разговоров:", error));
  };

  const markConversationRead = (convId: number) => {
    if (!userId) return;
    axios
      .post(
        "http://127.0.0.1:3000/api/conversations/read",
        { conversation_id: convId, user_id: Number(userId) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch(() => null);
  };

  useEffect(() => {
    if (socket) {
      socket.on("new_message", (message: Message) => {
        if (Number(message.conversation_id) === Number(conversationId)) {
          setMessages((prevMessages) => [...prevMessages, message]);
          scrollToBottom();
          if (Number(message.sender_id) !== Number(userId) && conversationId) {
            markConversationRead(conversationId);
          }
        }
        loadConversations();
      });

      socket.on("typing", (data: { conversation_id: number; sender_id: number }) => {
        if (data.conversation_id === conversationId && data.sender_id !== Number(userId)) {
          setIsTyping(true);
        }
      });

      socket.on("stop_typing", (data: { conversation_id: number; sender_id: number }) => {
        if (data.conversation_id === conversationId && data.sender_id !== Number(userId)) {
          setIsTyping(false);
        }
      });
    }
    return () => {
      socket?.off("new_message");
      socket?.off("typing");
      socket?.off("stop_typing");
    };
  }, [socket, conversationId, userId, token]);

  useEffect(() => {
    if (!userId) return;
    if (isAdmin) {
      axios
        .get("http://127.0.0.1:3000/employees", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const employees = (response.data || [])
            .filter((emp: any) => emp.id !== Number(userId))
            .map((emp: any) => ({
              id: emp.id,
              name: `${emp.fN} ${emp.lN}`,
            }));
          setTeam(employees);
          if (recipientId) {
            setCurrentRecipientId(String(recipientId));
          } else if (employees.length > 0) {
            setCurrentRecipientId(String(employees[0].id));
          }
        })
        .catch((error) => console.error("Ошибка при загрузке команды:", error));
    } else if (!recipientId) {
      axios
        .get("http://127.0.0.1:3000/api/admins", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const list = (response.data || []).map((admin: any) => ({
            id: admin.id,
            name: admin.name,
            email: admin.email,
          }));
          setAdmins(list);
          if (!currentRecipientId && list.length > 0) {
            setCurrentRecipientId(String(list[0].id));
          }
        })
        .catch((error) => console.error("Ошибка при загрузке администраторов:", error));
    } else {
      setCurrentRecipientId(recipientId);
    }
    loadConversations();
  }, [isAdmin, recipientId, token, userId]);

  useEffect(() => {
    if (!userId) return;
    if (currentRecipientId) {
      setMessages([]);
      setConversationId(null);
      setIsTyping(false);
      axios
        .post(
          "http://127.0.0.1:3000/api/conversations",
          { user_id: Number(userId), recipient_id: Number(currentRecipientId) },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => {
          setConversationId(response.data.conversation_id);
          setActiveConversationId(response.data.conversation_id);
          const normalizedMessages = (response.data.messages || []).map((msg: Message) => ({
            ...msg,
            conversation_id: response.data.conversation_id,
          }));
          setMessages(normalizedMessages);
          scrollToBottom();
          markConversationRead(response.data.conversation_id);
          loadConversations();
        })
        .catch((error) => console.error("Ошибка при загрузке или создании разговора:", error));
    }
  }, [currentRecipientId, userId, token]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && socket && conversationId) {
      const messageData = {
        conversation_id: conversationId,
        sender_id: Number(userId),
        content: inputValue,
      };
      socket.emit("send_message", messageData);
      setInputValue("");
      socket.emit("stop_typing", {
        conversation_id: conversationId,
        sender_id: Number(userId),
        recipient_id: Number(currentRecipientId),
      });
    }
  };

  const handleTyping = (value: string) => {
    setInputValue(value);
    if (!socket || !conversationId) return;

    socket.emit("typing", {
      conversation_id: conversationId,
      sender_id: Number(userId),
      recipient_id: Number(currentRecipientId),
    });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("stop_typing", {
        conversation_id: conversationId,
        sender_id: Number(userId),
        recipient_id: Number(currentRecipientId),
      });
    }, 1400);
  };

  const panelHeight = compact ? "h-96" : "h-[70vh]";
  const canSend = Boolean(socket && conversationId && currentRecipientId);
  const selectedConversation =
    currentRecipientId && conversations.length > 0
      ? conversations.find(
          (conv) => String(conv.other_user.id) === String(currentRecipientId)
        )
      : null;
  const adminConversations = isAdmin
    ? conversations
    : conversations.filter((conv) =>
        admins.some((admin) => admin.id === conv.other_user.id)
      );

  return (
    <div className={`bg-slate-800 text-white w-full ${panelHeight} rounded-xl shadow-2xl flex flex-col transition-all duration-300`}>
      {showHeader ? (
        <div className="bg-slate-900 p-4 flex justify-between items-center rounded-t-xl">
          <h3 className="font-bold">Чат</h3>
        </div>
      ) : null}
      {isAdmin ? (
        <div className="px-4 py-2 border-b border-slate-700">
          <div className="text-xs text-gray-400 uppercase mb-2">Разговоры</div>
          {team.length > 0 ? (
            <div className="flex gap-2 mb-2">
              <select
                className="bg-slate-700 text-white p-2 rounded-md w-full"
                value={newRecipientId}
                onChange={(e) => setNewRecipientId(e.target.value)}
              >
                <option value="">Новый чат...</option>
                {team.map((member) => (
                  <option key={member.id} value={String(member.id)}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button
                className="bg-blue-600 text-white px-3 rounded-md"
                onClick={() => {
                  if (newRecipientId) {
                    setCurrentRecipientId(newRecipientId);
                    setNewRecipientId("");
                  }
                }}
              >
                Открыть
              </button>
            </div>
          ) : null}
          <div className="max-h-28 overflow-y-auto space-y-2">
            {conversations.length === 0 ? (
              <div className="text-gray-400 text-sm">Разговоров нет</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => setCurrentRecipientId(String(conv.other_user.id))}
                  className={
                    activeConversationId === conv.conversation_id
                      ? "w-full text-left bg-blue-600 border border-blue-500 rounded-lg px-3 py-2"
                      : "w-full text-left bg-slate-700/70 border border-slate-600 rounded-lg px-3 py-2 hover:bg-blue-600"
                  }
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">{conv.other_user.name}</span>
                    {conv.unread_count > 0 ? (
                      <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-300 truncate">
                    {conv.last_message?.content || "Нет сообщений"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 border-b border-slate-700 space-y-2">
          {admins.length > 0 ? (
            <>
              {admins.length > 1 ? (
                <select
                  className="bg-slate-700 text-white p-2 rounded-md w-full"
                  value={currentRecipientId || ""}
                  onChange={(e) => setCurrentRecipientId(e.target.value)}
                >
                  {admins.map((admin) => (
                    <option key={admin.id} value={String(admin.id)}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-300">
                  Админ: {admins[0].name}
                </div>
              )}
              {adminConversations.length === 0 ? (
                <div className="text-xs text-gray-400">Начните диалог с админом</div>
              ) : (
                <div className="max-h-24 overflow-y-auto space-y-2">
                  {adminConversations.map((conv) => (
                    <button
                      key={conv.conversation_id}
                      onClick={() => setCurrentRecipientId(String(conv.other_user.id))}
                      className={
                        Number(activeConversationId) === Number(conv.conversation_id)
                          ? "w-full text-left bg-blue-600 border border-blue-500 rounded-lg px-3 py-2"
                          : "w-full text-left bg-slate-700/70 border border-slate-600 rounded-lg px-3 py-2 hover:bg-blue-600"
                      }
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold">
                          {conv.other_user.name}
                        </span>
                        {conv.unread_count > 0 ? (
                          <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                            {conv.unread_count}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-300 truncate">
                        {conv.last_message?.content || "Нет сообщений"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-400">Администраторы не найдены</div>
          )}
        </div>
      )}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${isOwnMessage(msg) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-2 rounded-lg max-w-xs ${
                  isOwnMessage(msg) ? "bg-blue-600" : "bg-slate-600"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className="text-xs text-gray-400 block text-right">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isTyping ? (
            <div className="text-xs text-gray-400">Печатает...</div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-700">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder={
            admins.length === 0 && !isAdmin
              ? "Нет администраторов"
              : "Введите сообщение..."
          }
          disabled={!canSend}
          className="w-full bg-slate-700 text-white p-2 rounded-md border-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </form>
    </div>
  );
};

export default ChatPanel;
