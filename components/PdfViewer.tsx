"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface PdfViewerProps {
    id: string;
    name: string;
    url: string;
    onClose: () => void;
    defaultPosition: { x: number; y: number };
}

export default function PdfViewer({ id, name, url, onClose, defaultPosition }: PdfViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [position, setPosition] = useState(defaultPosition);
    const [size, setSize] = useState({ width: 550, height: 700 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Load PDF.js and document
    useEffect(() => {
        let cancelled = false;

        async function loadPdf() {
            try {
                const pdfjsLib = await import("pdfjs-dist");

                // Set worker source
                if (typeof window !== "undefined") {
                    const pdfjsVersion = pdfjsLib.version;
                    pdfjsLib.GlobalWorkerOptions.workerSrc =
                        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;
                }

                const doc = await pdfjsLib.getDocument(url).promise;
                if (!cancelled) {
                    setPdfDoc(doc);
                    setNumPages(doc.numPages);
                }
            } catch (err) {
                console.error("PDF load error:", err);
            }
        }

        loadPdf();
        return () => { cancelled = true; };
    }, [url]);

    // Render page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let cancelled = false;

        async function renderPage() {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current!;
                const ctx = canvas.getContext("2d");
                if (!ctx || cancelled) return;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: ctx,
                    viewport,
                }).promise;
            } catch (err) {
                console.error("PDF render error:", err);
            }
        }

        renderPage();
        return () => { cancelled = true; };
    }, [pdfDoc, pageNum, scale]);

    // Drag logic
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!(e.target as HTMLElement).closest(".pdf-viewer-header")) return;
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    }, [position]);

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: Math.max(0, e.clientX - dragOffset.current.x),
                    y: Math.max(0, e.clientY - dragOffset.current.y),
                });
            }
            if (isResizing) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    setSize({
                        width: Math.max(340, e.clientX - rect.left),
                        height: Math.max(300, e.clientY - rect.top),
                    });
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, isResizing]);

    return (
        <div
            ref={containerRef}
            className="pdf-viewer"
            style={{
                top: position.y,
                left: position.x,
                width: size.width,
                height: size.height,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header (drag handle) */}
            <div className="pdf-viewer-header" ref={headerRef}>
                <span style={{ fontSize: 13 }}>📄</span>
                <span className="pdf-viewer-title">{name}</span>
                <button className="pdf-viewer-btn" onClick={onClose} title="Close">
                    <X size={14} />
                </button>
            </div>

            {/* Canvas (PDF render) */}
            <div className="pdf-viewer-canvas-wrapper">
                {numPages === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: 12, padding: 20 }}>
                        Loading PDF…
                    </div>
                ) : (
                    <canvas ref={canvasRef} />
                )}
            </div>

            {/* Footer (navigation) */}
            <div className="pdf-viewer-footer">
                <button className="pdf-viewer-btn" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} title="Zoom Out">
                    <ZoomOut size={13} />
                </button>
                <span>{Math.round(scale * 100)}%</span>
                <button className="pdf-viewer-btn" onClick={() => setScale(s => Math.min(3, s + 0.2))} title="Zoom In">
                    <ZoomIn size={13} />
                </button>
                <div style={{ width: 1, height: 14, background: "var(--border)", margin: "0 4px" }} />
                <button
                    className="pdf-viewer-btn"
                    onClick={() => setPageNum(p => Math.max(1, p - 1))}
                    disabled={pageNum <= 1}
                    title="Previous Page"
                >
                    <ChevronLeft size={14} />
                </button>
                <span>{pageNum} / {numPages}</span>
                <button
                    className="pdf-viewer-btn"
                    onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                    disabled={pageNum >= numPages}
                    title="Next Page"
                >
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Resize handle */}
            <div
                className="pdf-viewer-resize-handle"
                onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); }}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--text-muted)">
                    <path d="M14 14L8 14L14 8Z" />
                    <path d="M14 14L11 14L14 11Z" />
                </svg>
            </div>
        </div>
    );
}
