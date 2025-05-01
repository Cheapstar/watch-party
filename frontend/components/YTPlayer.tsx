"use client";

import { useEffect, useRef, useState } from "react";

interface props {
  url: string;
}

export function YTPlayer({ url }: props) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);

  // Extract video ID when URL changes
  useEffect(() => {
    const newVideoId = extractVideoId(url);
    setVideoId(newVideoId);
  }, [url]);

  // Load YouTube API once
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setApiLoaded(true);
      return;
    }

    // Load YouTube API if not already present
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      setApiLoaded(true);
    };

    // Add script to document
    document.body.appendChild(tag);

    // Cleanup function
    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  // Initialize or update player when API is loaded and videoId changes
  useEffect(() => {
    if (!apiLoaded || !videoId || !playerRef.current) return;

    // Destroy existing player if any
    if (player) {
      player.destroy();
    }

    // Create new player
    const newPlayer = new YT.Player(playerRef.current, {
      height: "100%",
      width: "100%",
      videoId: videoId,
      events: {
        onReady: onPlayerReady,
        onStateChange: stateChangeHandler,
      },
    });

    setPlayer(newPlayer);

    // Cleanup function
    return () => {
      if (newPlayer) {
        newPlayer.destroy();
      }
    };
  }, [apiLoaded, videoId]);

  function onPlayerReady(event: YT.PlayerEvent) {
    event.target.pauseVideo();
  }

  function stateChangeHandler(event: YT.PlayerEvent) {
    console.log("State is changed", event);
  }

  return (
    <div
      ref={playerRef}
      className="w-full h-full"
    ></div>
  );
}

function extractVideoId(url: string): string | null {
  const regex = /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
