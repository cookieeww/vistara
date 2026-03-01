"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Editor } from "@tldraw/tldraw";
import { X, Youtube, ExternalLink } from "lucide-react";
import { mediaSink } from "@/lib/mediaSink";

interface FocusModeProps {
    videoUrl: string;
    onVideoUrlChange: (url: string) => void;
    notes: string;
    onNotesChange: (notes: string) => void;
    onClose: () => void;
    editor: Editor | null;
}

function extractYoutubeId(url: string): string | null {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
}

export default function FocusMode({
    videoUrl, onVideoUrlChange, notes, onNotesChange, onClose,
}: FocusModeProps) {
    const [inputUrl, setInputUrl] = useState(videoUrl);
    const videoRef = useRef<HTMLVideoElement>(null);
    const dividerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [videoPanelWidth, setVideoPanelWidth] = useState(55); // percentage
    const [isDragging, setIsDragging] = useState(false);

    const ytId = extractYoutubeId(inputUrl || videoUrl);
    const isYt = !!ytId;
    const isLocalVideo = !isYt && (videoUrl.startsWith("blob:") || videoUrl.match(/\.(mp4|webm|ogg)$/i));

    const handleInputSubmit = () => {
        onVideoUrlChange(inputUrl);
    };

    // Resize divider logic
    const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
            setVideoPanelWidth(Math.min(80, Math.max(20, newWidth)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="focus-overlay" ref={containerRef}>
            {/* Left: Video pane */}
            <div className="focus-video-pane" style={{ width: `${videoPanelWidth}%` }}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: 12, right: 12, zIndex: 10,
                        background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 20, padding: "6px 12px", color: "white",
                        cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6
                    }}
                >
                    <X size={14} /> Exit Focus
                </button>

                {isYt ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0`}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ width: "100%", height: "100%", border: "none" }}
                    />
                ) : isLocalVideo ? (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                        onPlay={() => videoRef.current && mediaSink.acquire(videoRef.current)}
                        onPause={() => videoRef.current && mediaSink.release(videoRef.current)}
                    />
                ) : (
                    <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: 32 }}>
                        <Youtube size={56} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <div style={{ fontSize: 15, marginBottom: 20 }}>
                            Paste a YouTube URL or local video to watch here
                        </div>
                        <div style={{ display: "flex", gap: 8, maxWidth: 400 }}>
                            <input
                                value={inputUrl}
                                onChange={e => setInputUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=…"
                                style={{
                                    flex: 1, background: "var(--bg-tertiary)", border: "1px solid var(--border-strong)",
                                    borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none"
                                }}
                                onKeyDown={e => e.key === "Enter" && handleInputSubmit()}
                            />
                            <button
                                onClick={handleInputSubmit}
                                style={{
                                    background: "var(--accent)", border: "none", borderRadius: 8,
                                    padding: "8px 16px", color: "white", cursor: "pointer", fontSize: 13
                                }}
                            >
                                Load
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Resizable divider */}
            <div
                ref={dividerRef}
                className={`focus-divider ${isDragging ? "active" : ""}`}
                onMouseDown={handleDividerMouseDown}
            />

            {/* Right: Notes pane */}
            <div className="focus-notes-pane" style={{ flex: 1 }}>
                <div className="focus-notes-header">
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Study Notes</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Type your notes while watching</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {(inputUrl || videoUrl) && isYt && (
                            <button
                                onClick={() => window.open(`https://youtube.com/watch?v=${ytId}`, "_blank")}
                                style={{
                                    background: "var(--accent-muted)", border: "1px solid var(--border)",
                                    borderRadius: 8, padding: "6px 12px", color: "var(--text-secondary)",
                                    cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6
                                }}
                            >
                                <ExternalLink size={13} /> Open in Browser
                            </button>
                        )}
                    </div>
                </div>

                <textarea
                    className="focus-notes-area"
                    value={notes}
                    onChange={e => onNotesChange(e.target.value)}
                    placeholder={`📝 Start typing your notes here…\n\nTip: Use timestamps like [2:45] to mark key moments in the lecture.`}
                />

                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }}>
                    <span>{notes.split(/\s+/).filter(Boolean).length} words</span>
                    <span>{notes.length} characters</span>
                </div>
            </div>
        </div>
    );
}
