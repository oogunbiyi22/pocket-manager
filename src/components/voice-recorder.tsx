"use client";

/**
 * VoiceRecorder — a REAL voice memo recorder.
 *
 * Uses MediaRecorder + getUserMedia (the proxy's Permissions-Policy allows
 * microphone=(self)). The waveform is driven by a live AnalyserNode, so
 * the bars move with the artist's actual voice. Nothing is "saved" by this
 * component: it hands the recorded Blob to the caller, and the caller only
 * creates a capture once the audio is actually stored in the vault.
 *
 * Replaces the previous fake recorder, which animated bars over a timer
 * and stored a text label ("Voice memo · 12s") with no audio behind it.
 */

import { useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "requesting" | "recording" | "recorded" | "denied" | "unsupported";

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", ""];

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((candidate) => candidate === "" || MediaRecorder.isTypeSupported(candidate)) ?? "";
}

export function fileExtensionForMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export function VoiceRecorder({
  onRecorded,
}: {
  /** Fires when the artist accepts a take. The blob is real audio. */
  onRecorded: (blob: Blob, durationSeconds: number) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: 16 }, () => 6));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const secondsRef = useRef(0);

  function cleanupAudioGraph() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      queueMicrotask(() => setState("unsupported"));
    }
    return () => {
      cleanupAudioGraph();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    if (state === "recording" || state === "requesting") return;
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Live level meter — the bars are the artist's real voice.
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          setLevels(
            Array.from({ length: 16 }, (_, i) => {
              const value = data[Math.floor((i / 16) * data.length)] ?? 0;
              return 6 + Math.round((value / 255) * 26);
            }),
          );
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Meter is decorative — recording continues without it.
      }

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        blobRef.current = blob;
        setPreviewUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(blob);
        });
        cleanupAudioGraph();
        setState("recorded");
      };

      setSeconds(0);
      secondsRef.current = 0;
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);

      recorder.start(250);
      setState("recording");
    } catch {
      cleanupAudioGraph();
      setState("denied");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function discard() {
    blobRef.current = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    setState("idle");
  }

  function accept() {
    if (blobRef.current) onRecorded(blobRef.current, secondsRef.current);
    discard();
  }

  if (state === "unsupported") {
    return (
      <div className="py-4 text-center text-sm text-white/50">
        This browser can&apos;t record audio. Use a note instead — we won&apos;t fake a memo.
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-white/60">
          Microphone access was blocked. Allow the mic in your browser settings to record a real memo.
        </p>
        <button type="button" onClick={() => setState("idle")} className="text-xs text-white/40 underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex h-10 items-end gap-[3px]" aria-hidden>
        {levels.map((height, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full ${state === "recording" ? "bg-[#e24b4a]" : "bg-white/40"}`}
            style={{ height: state === "recording" ? height : 6, transition: "height 90ms ease" }}
          />
        ))}
      </div>

      <div className="text-[22px] font-light tabular-nums text-white/70">
        {state === "recorded"
          ? `${seconds}s recorded`
          : state === "recording"
            ? `${seconds}s`
            : state === "requesting"
              ? "Starting…"
              : "Ready to record"}
      </div>

      {state === "recorded" && previewUrl ? (
        <div className="flex w-full flex-col items-center gap-3">
          <audio controls src={previewUrl} className="w-full max-w-xs" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={accept}
              className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25"
            >
              Use this memo
            </button>
            <button
              type="button"
              onClick={discard}
              className="rounded-lg border-[0.5px] border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5"
            >
              Discard
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onMouseDown={state === "idle" ? () => void startRecording() : undefined}
            onMouseUp={state === "recording" ? stopRecording : undefined}
            onTouchStart={state === "idle" ? () => void startRecording() : undefined}
            onTouchEnd={state === "recording" ? stopRecording : undefined}
            className={`grid size-16 select-none place-items-center rounded-full text-2xl transition-all ${
              state === "recording" ? "scale-110 bg-[#e24b4a] ring-4 ring-[#e24b4a]/30" : "bg-white/15 hover:bg-white/25"
            }`}
            aria-label={state === "recording" ? "Release to stop" : "Hold to record"}
          >
            {state === "recording" ? "■" : "●"}
          </button>
          <div className="text-[11px] text-white/30">
            {state === "recording" ? "Release to stop" : "Hold to record"}
          </div>
        </>
      )}
    </div>
  );
}
