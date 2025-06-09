"use client";
import { MessageType, UserDetails } from "@/types";
import { SetStateAction, useRef, useState } from "react";
import { FaSmile } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import Picker from "emoji-picker-react";
import { WebSocketClient } from "@/lib/websocketClient";
import { LIGHT_THEME, DARK_THEME } from "@/constants"; // Adjust import path as needed

interface Props {
  socket: WebSocketClient;
  participants: Map<string, UserDetails>;
  messages: MessageType[];
  setMessages: React.Dispatch<SetStateAction<MessageType[]>>;
  currentUserId: string;
  roomId: string;
  darkMode: boolean;
}

export function LiveChat({
  socket,
  participants,
  messages,
  setMessages,
  currentUserId,
  roomId,
  darkMode,
}: Props) {
  const [messageInput, setMessageInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const theme = darkMode ? DARK_THEME : LIGHT_THEME;

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
    <div
      className="w-full h-screen flex flex-col rounded-lg shadow-sm transition-all"
      style={{
        backgroundColor: theme.liveChat.background,
        color: theme.textPrimary,
      }}
    >
      {/* Chat Header */}
      <div
        className="py-3 px-4 border-b transition-all"
        style={{
          backgroundColor: theme.liveChat.background,
          color: theme.textPrimary,
          borderBottomColor: theme.border,
        }}
      >
        <h3 className="text-lg font-medium transition-all">Live Chat</h3>
        <p
          className="text-xs transition-all"
          style={{ color: theme.textMuted }}
        >
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
                className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl transition-all"
                style={{
                  backgroundColor: isCurrentUser
                    ? theme.liveChat.message.user
                    : theme.liveChat.message.other,
                  color: isCurrentUser
                    ? theme.liveChat.message.userText
                    : theme.liveChat.message.otherText,
                }}
              >
                {!isCurrentUser && (
                  <p
                    className="text-xs font-bold mb-1 transition-all"
                    style={{ color: theme.textSecondary }}
                  >
                    {sender?.userName || "Unknown user"}
                  </p>
                )}
                <p className="break-words">{message.content}</p>
                <p
                  className="text-xs mt-1 transition-all"
                  style={{
                    color: isCurrentUser
                      ? `${theme.liveChat.message.userText}CC` // Adding opacity
                      : theme.textMuted,
                  }}
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
      <div
        className="border-t p-3 transition-all"
        style={{
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        }}
      >
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 transition-all"
        >
          <div className="relative flex-1">
            <div
              className="flex items-center rounded-full px-3 py-2 transition-all"
              style={{
                backgroundColor: theme.liveChat.input.background,
                border: `1px solid ${theme.liveChat.input.border}`,
              }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-sm transition-all"
                style={{
                  color: theme.textPrimary,
                }}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: theme.icon.default }}
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
            className="rounded-full p-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: theme.button.primary.background,
              color: theme.button.primary.text,
            }}
            disabled={messageInput.trim() === ""}
          >
            <IoSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
