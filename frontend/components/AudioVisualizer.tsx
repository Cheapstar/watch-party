"use client";

import { useEffect, useRef } from "react";

export function AudioVisualizer({
  audioStream,
  color = "#4f46e5",
  size = 120,
}: {
  audioStream: MediaStream;
  color?: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !audioStream) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parentElement = canvasRef.current.parentElement;

    canvas.width = parentElement?.clientWidth as number;
    canvas.height = parentElement?.clientHeight as number;

    // Setting up audio context and analyser
    const audioContext = new AudioContext();
    analyserRef.current = audioContext.createAnalyser();
    analyserRef.current.fftSize = 256;

    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    // Connecting audio stream to analyser
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyserRef.current);

    const resizeCanvas = () => {
      const parentElement = canvas.parentElement;
      if (parentElement) {
        canvas.width = parentElement.clientWidth;
        canvas.height = parentElement.clientHeight;
      }
    };

    // Initial sizing
    resizeCanvas();

    // Listen for resize
    window.addEventListener("resize", resizeCanvas);

    // Animation function
    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current || !ctx) return;

      animationRef.current = requestAnimationFrame(draw);

      // ddtaArray automatically update hota rahega, it is like attaching to the server
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Compute average volume
      const dataArray = dataArrayRef.current;
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / dataArray.length;

      // Scale radius based on volume
      const dynamicRadius = size / 2 + average / 5; // Adjust divisor to control sensitivity
      const center = {
        x: canvas.width / 2,
        y: canvas.height / 2,
      };

      ctx.beginPath();
      ctx.arc(center.x, center.y, dynamicRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.fill();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext.state !== "closed") {
        audioContext.close();
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [audioStream, color, size]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    ></canvas>
  );
}
