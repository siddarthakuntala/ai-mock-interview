"use client";
import { useEffect, useRef } from "react";

function AudioVisualizer({ stream, isRecording }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream || !isRecording) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const ctx = canvas.getContext("2d");
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barCount = 40;
      const step = Math.floor(dataArray.length / barCount);
      const barW = (W / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step];
        const pct = val / 255;
        const barH = Math.max(3, pct * H * 0.85);
        const x = i * (barW + 2);
        const y = (H - barH) / 2;

        const alpha = 0.3 + pct * 0.7;
        ctx.fillStyle = `rgba(30, 30, 30, ${alpha})`;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barW, barH, barW / 2);
        } else {
          ctx.rect(x, y, barW, barH);
        }
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioCtx.close();
    };
  }, [stream, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={56}
      style={{ width: "100%", height: "56px", display: "block" }}
    />
  );
}

export default AudioVisualizer;