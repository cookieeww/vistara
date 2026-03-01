"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Tldraw,
    Editor,
    loadSnapshot,
    getSnapshot,
    TLComponents,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import Toolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import FocusMode from "./FocusMode";
import PagesBar from "./PagesBar";
import StatusBar from "./StatusBar";
import PdfViewer from "./PdfViewer";
import {
    deserializeVistaraFile,
    serializeVistaraFile,
    createVistaraFile,
    TodoItem,
    VistaraFile,
} from "@/lib/persistence";

// ── Feature detection ─────────────────────────────────────────────────────
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

let tauriFs: typeof import("@tauri-apps/plugin-fs") | null = null;
let tauriDialog: typeof import("@tauri-apps/plugin-dialog") | null = null;

async function getTauriModules() {
    if (isTauri && !tauriFs) {
        tauriFs = await import("@tauri-apps/plugin-fs");
        tauriDialog = await import("@tauri-apps/plugin-dialog");
    }
    return { fs: tauriFs, dialog: tauriDialog };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function extractYoutubeId(url: string): string | null {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\\w-]{11})/
    );
    return match ? match[1] : null;
}

function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
}

// ── PDF state ──────────────────────────────────────────────────────────────
interface PdfFile {
    id: string;
    name: string;
    url: string;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CanvasWrapper() {
    const editorRef = useRef<Editor | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileDevice());
    const [activeTool, setActiveTool] = useState("select");
    const [focusMode, setFocusMode] = useState(false);
    const [focusVideoUrl, setFocusVideoUrl] = useState<string>("");
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [notes, setNotes] = useState("");
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [statusMsg, setStatusMsg] = useState("Ready — draw something!");
    const [assetMap, setAssetMap] = useState<Record<string, string>>({});
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const autosaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Theme management ──────────────────────────────────────────────────
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        const editor = editorRef.current;
        if (editor) {
            editor.user.updateUserPreferences({ colorScheme: theme });
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }, []);

    // ── Mobile sidebar behavior ───────────────────────────────────────────
    useEffect(() => {
        const handleResize = () => {
            if (isMobileDevice() && sidebarOpen) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [sidebarOpen]);

    // ── Save helpers ──────────────────────────────────────────────────────
    const buildVistaraFile = useCallback((): VistaraFile | null => {
        const editor = editorRef.current;
        if (!editor) return null;
        const snapshot = getSnapshot(editor.store) as unknown as VistaraFile["snapshot"];
        return createVistaraFile(snapshot, assetMap, todos, notes);
    }, [assetMap, todos, notes]);

    const saveToPath = useCallback(
        async (filePath: string) => {
            const file = buildVistaraFile();
            if (!file) return;
            const json = serializeVistaraFile(file);
            try {
                if (isTauri) {
                    const { fs } = await getTauriModules();
                    if (fs) await fs.writeTextFile(filePath, json);
                } else {
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "board.vistara";
                    a.click();
                    URL.revokeObjectURL(url);
                }
                setIsDirty(false);
                setStatusMsg("Saved ✓");
                setTimeout(() => setStatusMsg("Ready"), 2500);
            } catch (e) {
                setStatusMsg("Save failed!");
                console.error(e);
            }
        },
        [buildVistaraFile]
    );

    // ── Toolbar actions ───────────────────────────────────────────────────
    const handleNewBoard = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const ids = editor.getCurrentPageShapeIds();
        editor.deleteShapes(Array.from(ids));
        setTodos([]);
        setNotes("");
        setAssetMap({});
        setPdfFiles([]);
        setCurrentFilePath(null);
        setIsDirty(false);
        setStatusMsg("New board created");
    }, []);

    const handleOpenBoard = useCallback(async () => {
        try {
            if (isTauri) {
                const { fs, dialog } = await getTauriModules();
                if (!fs || !dialog) return;
                const selected = await dialog.open({
                    filters: [{ name: "Vistara Board", extensions: ["vistara"] }],
                    multiple: false,
                });
                if (!selected || typeof selected !== "string") return;
                const json = await fs.readTextFile(selected);
                const vf = deserializeVistaraFile(json);
                const editor = editorRef.current;
                if (!editor) return;
                loadSnapshot(editor.store, vf.snapshot as any);
                setTodos(vf.todos || []);
                setNotes(vf.notes || "");
                setAssetMap(vf.assets || {});
                setCurrentFilePath(selected);
                setIsDirty(false);
                setStatusMsg("Board loaded ✓");
            } else {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".vistara";
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const json = ev.target?.result as string;
                            const vf = deserializeVistaraFile(json);
                            const editor = editorRef.current;
                            if (!editor) return;
                            loadSnapshot(editor.store, vf.snapshot as any);
                            setTodos(vf.todos || []);
                            setNotes(vf.notes || "");
                            setAssetMap(vf.assets || {});
                            setIsDirty(false);
                            setStatusMsg("Board loaded ✓");
                        } catch {
                            setStatusMsg("Failed to parse .vistara file");
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            }
        } catch (err) {
            console.error("Open error:", err);
            setStatusMsg("Failed to open board");
        }
    }, []);

    const handleSave = useCallback(async () => {
        if (currentFilePath) {
            await saveToPath(currentFilePath);
        } else {
            if (isTauri) {
                const { dialog } = await getTauriModules();
                if (!dialog) return;
                const path = await dialog.save({
                    filters: [{ name: "Vistara Board", extensions: ["vistara"] }],
                    defaultPath: "board.vistara",
                });
                if (path) {
                    setCurrentFilePath(path);
                    await saveToPath(path);
                }
            } else {
                await saveToPath("board.vistara");
            }
        }
    }, [currentFilePath, saveToPath]);

    const handleSaveAs = useCallback(async () => {
        if (isTauri) {
            const { dialog } = await getTauriModules();
            if (!dialog) return;
            const path = await dialog.save({
                filters: [{ name: "Vistara Board", extensions: ["vistara"] }],
                defaultPath: "board-copy.vistara",
            });
            if (path) {
                setCurrentFilePath(path);
                await saveToPath(path);
            }
        } else {
            await saveToPath("board.vistara");
        }
    }, [saveToPath]);

    // ── File drop ─────────────────────────────────────────────────────────
    const handleFileDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(false);
            const editor = editorRef.current;
            if (!editor) return;

            const items = Array.from(e.dataTransfer.files);
            for (const file of items) {
                const point = editor.screenToPage({ x: e.clientX, y: e.clientY });

                if (file.type.startsWith("image/")) {
                    const url = URL.createObjectURL(file);
                    try {
                        await editor.putExternalContent({ type: "url", url, point });
                    } catch {
                        editor.createShape({
                            type: "image",
                            x: point.x - 150,
                            y: point.y - 100,
                            props: { url, w: 300, h: 200, crop: null },
                        } as any);
                    }
                } else if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
                    const url = URL.createObjectURL(file);
                    editor.createShape({
                        type: "text",
                        x: point.x - 100,
                        y: point.y - 20,
                        props: {
                            text: `🎵 ${file.name}\n[Media file — ${file.type}]`,
                            font: "mono",
                            size: "s",
                            w: 200,
                        },
                    } as any);
                    setAssetMap((prev) => ({ ...prev, [file.name]: url }));
                } else if (file.type === "application/pdf") {
                    // Spawn PDF viewer overlay
                    const url = URL.createObjectURL(file);
                    setPdfFiles((prev) => [
                        ...prev,
                        { id: `pdf-${Date.now()}`, name: file.name, url },
                    ]);
                    setStatusMsg(`Opened PDF: ${file.name}`);
                    setTimeout(() => setStatusMsg("Ready"), 2500);
                }
            }

            // Handle YouTube URL in drag text
            const text = e.dataTransfer.getData("text/plain");
            if (text) {
                const ytId = extractYoutubeId(text);
                if (ytId && editorRef.current) {
                    const point = editorRef.current.screenToPage({ x: e.clientX, y: e.clientY });
                    editorRef.current.createShape({
                        type: "embed",
                        x: point.x - 200,
                        y: point.y - 112,
                        props: {
                            url: `https://www.youtube-nocookie.com/embed/${ytId}`,
                            w: 400,
                            h: 225,
                        },
                    } as any);
                }
            }
            setIsDirty(true);
        },
        []
    );

    // ── Paste YouTube URL ─────────────────────────────────────────────────
    const handlePaste = useCallback((e: ClipboardEvent) => {
        const text = e.clipboardData?.getData("text/plain") ?? "";
        const ytId = extractYoutubeId(text);
        if (ytId && editorRef.current) {
            e.preventDefault();
            const editor = editorRef.current;
            const vpCenter = editor.getViewportScreenCenter();
            const point = editor.screenToPage(vpCenter);
            editor.createShape({
                type: "embed",
                x: point.x - 200,
                y: point.y - 125,
                props: {
                    url: `https://www.youtube-nocookie.com/embed/${ytId}`,
                    w: 400,
                    h: 225,
                },
            } as any);
            setIsDirty(true);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [handlePaste]);

    // ── Keyboard shortcut: Ctrl+S ─────────────────────────────────────────
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleSave]);

    // ── Autosave every 30s ────────────────────────────────────────────────
    useEffect(() => {
        autosaveTimer.current = setInterval(() => {
            if (isDirty && currentFilePath) {
                saveToPath(currentFilePath);
            }
        }, 30000);
        return () => {
            if (autosaveTimer.current) clearInterval(autosaveTimer.current);
        };
    }, [isDirty, currentFilePath, saveToPath]);

    // ── Export ────────────────────────────────────────────────────────────
    const handleExport = useCallback(
        async (format: "png" | "jpg" | "svg") => {
            const editor = editorRef.current;
            if (!editor) return;
            try {
                const shapeIds = Array.from(editor.getCurrentPageShapeIds());
                if (shapeIds.length === 0) {
                    setStatusMsg("Nothing to export!");
                    return;
                }
                const result = await editor.toImageDataUrl(shapeIds, {
                    format: format === "svg" ? "svg" : format === "jpg" ? "jpeg" : "png",
                    padding: 32,
                });
                const dataUrl = typeof result === "string" ? result : (result as any).url;
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = `vistara-export.${format}`;
                a.click();
                setStatusMsg("Exported ✓");
                setTimeout(() => setStatusMsg("Ready"), 2000);
            } catch (err) {
                console.error(err);
                setStatusMsg("Export failed — add shapes first");
                setTimeout(() => setStatusMsg("Ready"), 2500);
            }
        },
        []
    );

    // ── Tool switching ────────────────────────────────────────────────────
    const setTool = useCallback((tool: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        setActiveTool(tool);
        editor.setCurrentTool(tool);
    }, []);

    // ── PDF viewer management ─────────────────────────────────────────────
    const closePdf = useCallback((id: string) => {
        setPdfFiles((prev) => {
            const removed = prev.find((p) => p.id === id);
            if (removed) URL.revokeObjectURL(removed.url);
            return prev.filter((p) => p.id !== id);
        });
    }, []);

    // ── tldraw component overrides ────────────────────────────────────────
    // Re-enable native tldraw UI: style panel, context menu, keyboard shortcuts
    // Only hide tldraw's built-in toolbar and main menu (we use our own)
    const components: TLComponents = {
        Toolbar: null,
        MainMenu: null,
        PageMenu: null,
        NavigationPanel: null,
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
                background: "var(--bg-primary)",
            }}
        >
            {/* ── Top Toolbar ── */}
            <Toolbar
                activeTool={activeTool}
                onSetTool={setTool}
                onNewBoard={handleNewBoard}
                onOpenBoard={handleOpenBoard}
                onSave={handleSave}
                onSaveAs={handleSaveAs}
                onExport={handleExport}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
                onToggleFocusMode={() => setFocusMode((v) => !v)}
                isSidebarOpen={sidebarOpen}
                isDirty={isDirty}
                editor={editorRef.current}
                theme={theme}
                onToggleTheme={toggleTheme}
            />

            {/* ── Canvas + Sidebar ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* Canvas drop zone */}
                <div
                    className={`canvas-drop-zone ${dragOver ? "drag-over" : ""}`}
                    style={{ flex: 1, position: "relative", overflow: "hidden" }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                >
                    <Tldraw
                        onMount={(editor) => {
                            editorRef.current = editor;
                            editor.user.updateUserPreferences({ colorScheme: theme });
                            editor.store.listen(
                                () => setIsDirty(true),
                                { source: "user", scope: "document" }
                            );
                        }}
                        autoFocus
                        components={components}
                    />
                </div>

                {/* ── Mobile Sidebar Backdrop ── */}
                {sidebarOpen && isMobileDevice() && (
                    <div
                        className="sidebar-backdrop"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ── Sidebar ── */}
                <div className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
                    <Sidebar
                        todos={todos}
                        onTodosChange={setTodos}
                        notes={notes}
                        onNotesChange={setNotes}
                        editor={editorRef.current}
                    />
                </div>
            </div>

            {/* ── Pages Bar ── */}
            <PagesBar editor={editorRef.current} />

            {/* ── Status Bar ── */}
            <StatusBar
                message={statusMsg}
                filePath={currentFilePath}
                isDirty={isDirty}
            />

            {/* ── Focus / Study Mode Overlay ── */}
            {focusMode && (
                <FocusMode
                    videoUrl={focusVideoUrl}
                    onVideoUrlChange={setFocusVideoUrl}
                    notes={notes}
                    onNotesChange={setNotes}
                    onClose={() => setFocusMode(false)}
                    editor={editorRef.current}
                />
            )}

            {/* ── PDF Viewer Overlays ── */}
            {pdfFiles.map((pdf, i) => (
                <PdfViewer
                    key={pdf.id}
                    id={pdf.id}
                    name={pdf.name}
                    url={pdf.url}
                    onClose={() => closePdf(pdf.id)}
                    defaultPosition={{ x: 80 + i * 30, y: 80 + i * 30 }}
                />
            ))}
        </div>
    );
}
