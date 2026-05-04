import { useRef, useState, useCallback, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Camera, ImageUp, Barcode, Sparkles, Zap,
  X, RotateCcw, Loader2, AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

type ScanMode = "idle" | "camera" | "uploading" | "processing" | "error";

const Scan = () => {
  const navigate   = useNavigate();
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [mode,    setMode]    = useState<ScanMode>("idle");
  const [errMsg,  setErrMsg]  = useState("");
  const [capture, setCapture] = useState(false);   // flash animation

  // ── Stop camera on unmount ────────────────────────────────────────────────
  useEffect(() => () => stopCamera(), []);

  // ── Camera helpers ────────────────────────────────────────────────────────
  const startCamera = async () => {
    setErrMsg("");
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setErrMsg("Camera access denied. Please allow camera permissions.");
      setMode("error");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapture(true);
    setTimeout(() => setCapture(false), 200);

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      stopCamera();
      await submitImage(blob, "capture.jpg");
    }, "image/jpeg", 0.92);
  }, []);

  // ── File upload helper ────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await submitImage(file, file.name);
    e.target.value = "";
  };

  // ── Barcode manual entry ──────────────────────────────────────────────────
  const submitBarcode = async (barcode: string) => {
    setMode("processing");
    try {
      const res = await fetch(`${API_BASE}/scan/barcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, user_id: getUserId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      navigate("/result", { state: data });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrMsg(msg);
      setMode("error");
    }
  };

  // ── Core submit ───────────────────────────────────────────────────────────
  const submitImage = async (blob: Blob, filename: string) => {
    setMode("processing");
    stopCamera();

    const form = new FormData();
    form.append("image", blob, filename);
    const uid = getUserId();
    if (uid) form.append("user_id", String(uid));

    try {
      const res = await fetch(`${API_BASE}/scan/image`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      navigate("/result", { state: data });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrMsg(msg);
      setMode("error");
    }
  };

  const getUserId = () => {
    try {
      return parseInt(localStorage.getItem("aurascan_user_id") ?? "", 10) || null;
    } catch { return null; }
  };

  const reset = () => { stopCamera(); setMode("idle"); setErrMsg(""); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-dvh pb-32 flex flex-col">
      <header className="container max-w-3xl flex items-center justify-between py-6">
        <Logo />
        <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs">
          <span className="size-1.5 rounded-full bg-verdict-good animate-pulse" /> Profile active
        </span>
      </header>

      <div className="container max-w-3xl flex-1 flex flex-col items-center justify-center text-center">

        {/* ── IDLE ─────────────────────────────────────────────────────────── */}
        {mode === "idle" && (
          <>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3 animate-fade-in">
              Ready to analyse
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold max-w-xl animate-fade-in">
              Point. Scan. <span className="text-gradient">Know.</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-md animate-fade-in">
              Capture any product label or barcode. AuraScan delivers a personalised verdict in seconds.
            </p>

            {/* Big scan button */}
            <div className="relative my-14">
              <div className="absolute -inset-12 bg-gradient-aura blur-2xl opacity-90" aria-hidden />
              <button
                onClick={startCamera}
                className="relative size-56 sm:size-64 rounded-full bg-gradient-brand shadow-glow grid place-items-center group animate-pulse-glow"
                aria-label="Open camera"
              >
                <span className="absolute inset-3 rounded-full border border-primary-foreground/20" />
                <span className="absolute inset-6 rounded-full border border-primary-foreground/10" />
                <Camera className="size-20 text-primary-foreground transition-transform group-hover:scale-110 duration-300" strokeWidth={1.5} />
              </button>
              <p className="mt-6 text-sm text-muted-foreground">Tap to open live scanner</p>
            </div>

            {/* Secondary options */}
            <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg">
              <button
                onClick={() => fileRef.current?.click()}
                className="glass-strong rounded-2xl p-5 text-left flex items-center gap-4 hover:border-primary/40 transition-all hover:-translate-y-0.5"
              >
                <span className="size-12 rounded-xl bg-primary/15 grid place-items-center text-primary">
                  <ImageUp className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">Upload image</p>
                  <p className="text-xs text-muted-foreground">From gallery or files</p>
                </div>
              </button>

              <BarcodeEntry onSubmit={submitBarcode} />
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> Fast analysis</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5 text-accent" /> Personalised to you</span>
            </div>
          </>
        )}

        {/* ── CAMERA ───────────────────────────────────────────────────────── */}
        {mode === "camera" && (
          <div className="w-full max-w-lg animate-scale-in">
            <div className="relative rounded-3xl overflow-hidden border border-primary/30 shadow-glow">
              {/* Flash overlay */}
              <div className={cn(
                "absolute inset-0 bg-white z-20 transition-opacity duration-100 pointer-events-none",
                capture ? "opacity-60" : "opacity-0",
              )} />

              {/* Scanner frame corners */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {["top-4 left-4", "top-4 right-4 rotate-90", "bottom-4 right-4 rotate-180", "bottom-4 left-4 -rotate-90"].map((pos, i) => (
                  <span key={i} className={`absolute ${pos} size-8 border-l-2 border-t-2 border-primary rounded-tl-sm`} />
                ))}
              </div>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full object-cover aspect-[4/3]"
              />
            </div>

            <p className="text-sm text-muted-foreground mt-4 mb-6">
              Centre the label or barcode in the frame, then capture.
            </p>

            <div className="flex gap-3 justify-center">
              <Button variant="glass" onClick={reset} className="rounded-full gap-2">
                <X className="size-4" /> Cancel
              </Button>
              <Button variant="hero" size="lg" onClick={captureFrame} className="rounded-full gap-2">
                <Camera className="size-5" /> Capture
              </Button>
            </div>

            {/* Hidden canvas for frame grab */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* ── PROCESSING ───────────────────────────────────────────────────── */}
        {mode === "processing" && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-aura blur-2xl opacity-70" />
              <div className="relative size-28 rounded-full bg-gradient-brand grid place-items-center shadow-glow">
                <Loader2 className="size-12 text-primary-foreground animate-spin" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">Analysing…</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Running barcode scan, OCR and nutrition lookup
              </p>
            </div>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────────── */}
        {mode === "error" && (
          <div className="flex flex-col items-center gap-6 max-w-sm animate-fade-in">
            <div className="size-20 rounded-full border border-verdict-bad/40 bg-verdict-bad/10 grid place-items-center">
              <AlertCircle className="size-10 text-verdict-bad" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-verdict-bad">Scan failed</p>
              <p className="text-muted-foreground mt-2 text-sm">{errMsg}</p>
            </div>
            <Button variant="hero" onClick={reset} className="rounded-full gap-2">
              <RotateCcw className="size-4" /> Try again
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <BottomNav />
    </main>
  );
};


// ── Inline barcode manual entry card ─────────────────────────────────────────
const BarcodeEntry = ({ onSubmit }: { onSubmit: (b: string) => void }) => {
  const [open,  setOpen]  = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (v) { onSubmit(v); setValue(""); setOpen(false); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass-strong rounded-2xl p-5 text-left flex items-center gap-4 hover:border-accent/40 transition-all hover:-translate-y-0.5"
      >
        <span className="size-12 rounded-xl bg-accent/15 grid place-items-center text-accent">
          <Barcode className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Enter barcode</p>
          <p className="text-xs text-muted-foreground">Type product code</p>
        </div>
      </button>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-5 flex flex-col gap-3 col-span-full sm:col-span-1">
      <p className="font-semibold text-sm flex items-center gap-2">
        <Barcode className="size-4 text-accent" /> Enter barcode
      </p>
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        placeholder="e.g. 3017624010701"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="rounded-xl bg-secondary/40 border border-border/60 px-3 py-2 text-sm outline-none focus:border-accent/60 transition-colors"
      />
      <div className="flex gap-2">
        <Button variant="glass" size="sm" className="flex-1 rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="hero"  size="sm" className="flex-1 rounded-full" onClick={submit} disabled={!value.trim()}>Lookup</Button>
      </div>
    </div>
  );
};

export default Scan;
