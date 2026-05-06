// Виджет чата (кнопка + панель)
import React from "react";
import { FiMessageSquare, FiX } from "react-icons/fi";
import ChatPanel from "./chat/ChatPanel";

interface ChatWidgetProps {
  userId: string | number;
  recipientId: string | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  token: string;
  isAdmin: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  userId,
  recipientId,
  isOpen,
  onOpen,
  onClose,
  token,
  isAdmin,
}) => {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          onClick={onOpen}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
        >
          <FiMessageSquare size={24} />
        </button>
      ) : (
        <div className="bg-slate-800 text-white w-80 h-[420px] rounded-xl shadow-2xl flex flex-col transition-all duration-300">
          <div className="bg-slate-900 p-4 flex justify-between items-center rounded-t-xl">
            <h3 className="font-bold">Чат</h3>
            <button onClick={onClose} className="hover:text-gray-300">
              <FiX size={20} />
            </button>
          </div>
          <ChatPanel
            userId={userId}
            recipientId={recipientId}
            token={token}
            isAdmin={isAdmin}
            compact
            showHeader={false}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
