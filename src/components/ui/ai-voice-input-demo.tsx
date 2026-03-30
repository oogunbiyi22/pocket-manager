"use client";

import { useState } from "react";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";

export function AIVoiceInputDemo() {
  const [recordings, setRecordings] = useState<{ duration: number; timestamp: Date }[]>([]);

  const handleStop = (duration: number) => {
    if (duration <= 0) return;
    setRecordings((prev) => [...prev.slice(-4), { duration, timestamp: new Date() }]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <AIVoiceInput onStop={handleStop} />
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
