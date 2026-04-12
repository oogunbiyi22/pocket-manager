"use client";

import { useEffect, useRef, useState } from "react";
import { AIVoiceInput, VoiceRecording } from "@/components/ui/ai-voice-input";

export function AIVoiceInputDemo() {
  const [recordings, setRecordings] = useState<Array<{ duration: number; timestamp: Date; url: string; mimeType: string }>>([]);
  const retiredUrlsRef = useRef<string[]>([]);
  const recordingsRef = useRef(recordings);

  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  useEffect(() => {
    const retiredUrls = retiredUrlsRef;
    const currentRecordings = recordingsRef;

    return () => {
      retiredUrls.current.forEach((url) => URL.revokeObjectURL(url));
      currentRecordings.current.forEach((recording) => URL.revokeObjectURL(recording.url));
    };
  }, []);

  const handleStop = (recording: VoiceRecording) => {
    if (recording.duration <= 0) return;
    setRecordings((prev) => {
      const trimmed = prev.slice(0, 3);
      retiredUrlsRef.current.push(...prev.slice(3).map((item) => item.url));

      return [
        {
          duration: recording.duration,
          timestamp: new Date(),
          url: recording.url,
          mimeType: recording.mimeType,
        },
        ...trimmed,
      ];
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <AIVoiceInput onRecordingComplete={handleStop} />
      </div>

      {recordings.length ? (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.28em] text-emerald-200/60">Recent voice notes</div>
          {recordings
            .slice()
            .reverse()
            .map((recording, index) => (
              <div key={`${recording.timestamp.toISOString()}-${index}`} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                <div className="font-medium text-white">Voice idea captured</div>
                <div className="mt-1 text-white/55">
                  {recording.duration}s · {recording.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
                <audio controls className="mt-3 w-full" preload="metadata">
                  <source src={recording.url} type={recording.mimeType} />
                </audio>
              </div>
            ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-white/45">
          No voice ideas captured yet.
        </div>
      )}
    </div>
  );
}
