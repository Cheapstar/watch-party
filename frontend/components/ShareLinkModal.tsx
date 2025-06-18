import React, { useState } from "react";
import { LuCopy, LuCheck, LuX } from "react-icons/lu";

interface props {
  showShareLinkModal: boolean;
  setShowShareLinkModal: (v: boolean) => void;
  darkMode: boolean;
}

export const ShareLinkModal = ({
  darkMode,
  showShareLinkModal,
  setShowShareLinkModal,
}: props) => {
  const [copied, setCopied] = useState(false);

  // Get current URL (in a real app, this would be your room URL)
  const shareLink = typeof window !== "undefined" ? window.location.href : "";

  const styles = darkMode ? "bg-[#1E293B]" : "bg-[#F8FAFC]";
  const textColor = darkMode ? "text-white" : "text-gray-900";
  const secondaryTextColor = darkMode ? "text-gray-300" : "text-gray-600";
  const borderColor = darkMode ? "border-gray-600" : "border-gray-300";
  const inputBg = darkMode ? "bg-gray-700" : "bg-white";
  const buttonBg = darkMode
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-blue-500 hover:bg-blue-600";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  if (!showShareLinkModal) return null;

  return (
    <div
      className="fixed h-screen w-screen bg-black/20 backdrop-blur-lg flex justify-center items-center z-[50]"
      onClick={() => setShowShareLinkModal(false)}
    >
      <div
        className={`${styles} rounded-lg shadow-xl max-w-md w-full p-6 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setShowShareLinkModal(false)}
          className={`absolute top-4 right-4 ${secondaryTextColor} hover:${textColor} transition-colors`}
        >
          <LuX size={20} />
        </button>

        {/* Privacy notice */}
        <div className="mb-6">
          <div className="flex items-start gap-2 mb-4">
            <span className="text-lg">🔒</span>
            <p className={`${secondaryTextColor} text-sm leading-relaxed`}>
              Don&apos;t worry, the session is end-to-end encrypted, and fully
              private. Not even our server can see what you draw.
            </p>
          </div>

          <p className={`${textColor} text-sm font-medium`}>
            * Please share this link to your friends so that they can enter in
            the room
          </p>
        </div>

        {/* Link sharing section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className={`flex-1 px-3 py-2 ${inputBg} ${textColor} border ${borderColor} rounded-md text-sm font-mono`}
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 ${buttonBg} text-white rounded-md transition-colors flex items-center gap-2 text-sm font-medium`}
            >
              {copied ? (
                <>
                  <LuCheck size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <LuCopy size={16} />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
