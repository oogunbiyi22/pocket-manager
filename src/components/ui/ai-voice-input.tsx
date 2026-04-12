"use client";

import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type VoiceRecording = {
  blob: Blob;
  duration: number;
  mimeType: string;
  url: string;
};

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onRecordingComplete?: (recording: VoiceRecording) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
  label?: string;
  idleHint?: string;
  listeningHint?: string;
  disabled?: boolean;
}

export function AIVoiceInput({
  onStart,
  onStop,
  onRecordingComplete,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className,
  label = "Voice input",
  idleHint = "Tap to start recording",
  listeningHint = "Listening… tap again to stop",
  disabled = false,
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isDemo, setIsDemo] = useState(demoMode);
  const [error, setError] = useState<string | null>(null);
  const timeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array.from({ length: visualizerBars }, (_, index) => 28 + ((index * 17) % 68)),
  );

  useEffect(() => {
    if (!submitted) return;

    onStart?.();
    const intervalId = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [submitted, onStart]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval]);

  useEffect(() => {
    if (!submitted) return;

    const intervalId = setInterval(() => {
      setBarHeights((current) =>
        current.map((height, index) => 24 + ((height + 11 + index * 7) % 76)),
      );
    }, 240);

    return () => clearInterval(intervalId);
  }, [submitted]);

  const cleanupStream = () => {
    recorderRef.current = null;
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (disabled) return;

    if (isDemo) {
      setIsDemo(false);
      void stopRecording();
      return;
    }

    if (submitted) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const startRecording = async () => {
    if (disabled) return;
    setError(null);

    if (typeof window === "undefined" || typeof navigator === "undefined") {
      setError("Voice input is only available in the browser.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser does not support microphone recording.");
      return;
    }

    if (!isDemo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = getSupportedMimeType();
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

        chunksRef.current = [];
        streamRef.current = stream;
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          setError("Microphone recording failed.");
        };

        recorder.start();
      } catch {
        setError("Microphone permission was denied or unavailable.");
        cleanupStream();
        return;
      }
    }

    setSubmitted(true);
  };

  const stopRecording = async () => {
    const duration = timeRef.current;
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      stopPromiseRef.current = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          if (blob.size > 0) {
            onRecordingComplete?.({
              blob,
              duration,
              mimeType: recorder.mimeType || blob.type || "audio/webm",
              url: URL.createObjectURL(blob),
            });
          }

          cleanupStream();
          resolve();
        };
      });

      recorder.stop();
      await stopPromiseRef.current;
      stopPromiseRef.current = null;
    } else {
      cleanupStream();
    }

    setSubmitted(false);
    setTime(0);
    onStop?.(duration);
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-2">
        <button
          className={cn(
            "group flex h-16 w-16 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50",
            submitted ? "bg-none" : "bg-none hover:bg-black/10 dark:hover:bg-white/10",
            disabled && "cursor-not-allowed opacity-50",
          )}
          type="button"
          onClick={handleClick}
          aria-pressed={submitted}
          aria-label={submitted ? `Stop ${label.toLowerCase()}` : `Start ${label.toLowerCase()}`}
          disabled={disabled}
        >
          {submitted ? (
            <div
              className="h-6 w-6 cursor-pointer rounded-sm bg-black animate-spin dark:bg-white"
              style={{ animationDuration: "3s" }}
            />
          ) : (
            <Mic className="h-6 w-6 text-black/70 dark:text-white/70" />
          )}
        </button>

        <span className="text-xs uppercase tracking-[0.22em] text-black/45 dark:text-white/45">{label}</span>

        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300",
            submitted ? "text-black/70 dark:text-white/70" : "text-black/30 dark:text-white/30",
          )}
          aria-live="polite"
        >
          {formatTime(time)}
        </span>

        <div className="flex h-4 w-64 items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                submitted ? "bg-black/50 h-2 animate-pulse dark:bg-white/50" : "bg-black/10 h-1 dark:bg-white/10",
              )}
              style={
                submitted
                  ? {
                      height: `${barHeights[i] ?? 32}%`,
                      animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="min-h-4 text-center text-xs text-black/70 dark:text-white/70" aria-live="polite">
          {disabled ? "Voice input unavailable" : error ? error : submitted ? listeningHint : idleHint}
        </p>
      </div>
    </div>
  );
}

function getSupportedMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}
