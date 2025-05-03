import { MessageType, UserDetails } from "@/types";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { FaSmile } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import Picker from "emoji-picker-react";
import { WebSocketClient } from "@/lib/websocketClient";

interface Props {
  socket: WebSocketClient;
  participants: Map<string, UserDetails>;
  messages: MessageType[];
  setMessages: React.Dispatch<SetStateAction<MessageType[]>>;
  currentUserId: string;
  roomId: string;
}

export function LiveChat({
  socket,
  participants,
  messages,
  setMessages,
  currentUserId,
  roomId,
}: Props) {
  const [messageInput, setMessageInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (messageInput.trim() === "") return;

    const newMessage: MessageType = {
      id: crypto.randomUUID(),
      senderId: currentUserId,
      roomId: roomId,
      content: messageInput,
      createdAt: Math.floor(Date.now() / 1000),
    };

    socket.send("livechat-save-message", {
      message: newMessage,
    });

    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
  };

  const formatTime = (timestamp: number) => {
    // Convert Unix timestamp (seconds)
    const timeInMs = timestamp > 10000000000 ? timestamp : timestamp * 1000;
    const date = new Date(timeInMs);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  return (
    <div className="w-full h-screen flex flex-col border rounded-lg shadow-sm">
      {/* Chat Header */}
      <div className="py-3 px-4 border-b bg-gray-50">
        <h3 className="text-lg font-medium">Live Chat</h3>
        <p className="text-xs text-gray-500">
          {participants.size} participants
        </p>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;
          const sender = participants.get(message.senderId);
          const avatarUrl = `https://api.dicebear.com/9.x/dylan/svg?radius=50&seed=${message.senderId}`;

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isCurrentUser && (
                <img
                  src={avatarUrl}
                  alt={`${sender?.userName || "User"} avatar`}
                  className="w-8 h-8 rounded-full"
                />
              )}

              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                  isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                {!isCurrentUser && (
                  <p className="text-xs font-bold mb-1">
                    {sender?.userName || "Unknown user"}
                  </p>
                )}
                <p className="break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isCurrentUser ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>

              {isCurrentUser && (
                <img
                  src={avatarUrl}
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-3 bg-white">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaSmile size={20} />
              </button>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-10">
                <Picker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3"
            disabled={messageInput.trim() === ""}
          >
            <IoSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
