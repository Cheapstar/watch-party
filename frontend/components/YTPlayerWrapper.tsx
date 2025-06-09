import { MdClose } from "react-icons/md";
import { YTPlayer } from "./YTPlayer";

interface YouTubePlayerWrapperProps {
  url: string;
  handleRemoveExternalMedia: () => void;
  darkMode: boolean;
  mediaKey?: number;
}

export function YouTubePlayerWrapper({
  url,
  handleRemoveExternalMedia,
  mediaKey = 0,
  darkMode,
}: YouTubePlayerWrapperProps) {
  const styles = darkMode ? "1E293B" : "bg-[#FFFFFF]";

  return (
    <div
      className={`col-span-3 row-span-2 relative w-full h-full rounded-lg overflow-hidden ${styles}`}
    >
      <div className="absolute top-2 right-2 z-50">
        <button
          onClick={handleRemoveExternalMedia}
          className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-2"
        >
          <MdClose size={16} /> Remove Video
        </button>
      </div>
      {/* Using key to force re-render when URL changes */}
      <div
        key={`yt-player-${mediaKey}-${url}`}
        className="w-full h-full"
      >
        <YTPlayer url={url} />
      </div>
    </div>
  );
}
