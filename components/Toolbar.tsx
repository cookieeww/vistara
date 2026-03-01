"use client";

import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@tldraw/tldraw";
import {
    MousePointer2, Pencil, Square, Type, Eraser,
    FolderOpen, Undo2, Redo2,
    ZoomIn, ZoomOut, Trash2, Eye,
    Save, Download, Plus, PanelRight,
    ChevronDown, Highlighter, Pointer,
    StickyNote, Frame, Sun, Moon, Minus, MoveRight
} from "lucide-react";

interface ToolbarProps {
    activeTool: string;
    onSetTool: (tool: string) => void;
    onNewBoard: () => void;
    onOpenBoard: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onExport: (format: "png" | "jpg" | "svg") => void;
    onToggleSidebar: () => void;
    onToggleFocusMode: () => void;
    isSidebarOpen: boolean;
    isDirty: boolean;
    editor: Editor | null;
    theme: "dark" | "light";
    onToggleTheme: () => void;
}

const drawTools = [
    { id: "select", icon: <MousePointer2 size={15} />, title: "Select (V)" },
    { id: "hand", icon: <span style={{ fontSize: 14 }}>✋</span>, title: "Pan (H)" },
    { id: "draw", icon: <Pencil size={15} />, title: "Draw (D)" },
    { id: "highlight", icon: <Highlighter size={15} />, title: "Highlighter" },
    { id: "eraser", icon: <Eraser size={15} />, title: "Eraser (E)" },
    { id: "laser", icon: <Pointer size={15} />, title: "Laser Pointer" },
];

const textTools = [
    { id: "text", icon: <Type size={15} />, title: "Text (T)" },
    { id: "note", icon: <StickyNote size={15} />, title: "Sticky Note (N)" },
];

const shapeTools = [
    { id: "geo", icon: <Square size={15} />, title: "Shapes (R)" },
    { id: "line", icon: <Minus size={15} />, title: "Line (L)" },
    { id: "arrow", icon: <MoveRight size={15} />, title: "Arrow (A)" },
    { id: "frame", icon: <Frame size={15} />, title: "Frame (F)" },
];

export default function Toolbar({
    activeTool, onSetTool, onNewBoard, onOpenBoard, onSave, onSaveAs,
    onExport, onToggleSidebar, onToggleFocusMode, isSidebarOpen, isDirty, editor,
    theme, onToggleTheme
}: ToolbarProps) {
    const [showExport, setShowExport] = useState(false);
    const [showFile, setShowFile] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (showFile && fileRef.current && !fileRef.current.contains(e.target as Node)) {
                setShowFile(false);
            }
            if (showExport && exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setShowExport(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showFile, showExport]);

    const undo = () => editor?.undo();
    const redo = () => editor?.redo();
    const zoomIn = () => editor?.zoomIn();
    const zoomOut = () => editor?.zoomOut();
    const clearBoard = () => {
        if (editor) {
            const ids = editor.getCurrentPageShapeIds();
            editor.deleteShapes(Array.from(ids));
        }
    };

    const ToolButton = ({ id, icon, title }: { id: string; icon: React.ReactNode; title: string }) => (
        <button
            className={`toolbar-btn ${activeTool === id ? "active" : ""}`}
            title={title}
            onClick={() => onSetTool(id)}
        >
            {icon}
        </button>
    );

    return (
        <div className="toolbar">
            {/* Logo */}
            <span className="toolbar-logo">Vistara</span>
            <div className="toolbar-separator" />

            {/* File menu */}
            <div style={{ position: "relative" }} ref={fileRef}>
                <button className="toolbar-btn" onClick={() => setShowFile(!showFile)}>
                    <FolderOpen size={14} />
                    <span className="label">File</span>
                    <ChevronDown size={10} />
                </button>
                {showFile && (
                    <div className="toolbar-dropdown">
                        {[
                            { label: "New Board", action: () => { onNewBoard(); setShowFile(false); } },
                            { label: "Open Board…", action: () => { onOpenBoard(); setShowFile(false); } },
                            { label: isDirty ? "Save •" : "Save", action: () => { onSave(); setShowFile(false); } },
                            { label: "Save As…", action: () => { onSaveAs(); setShowFile(false); } },
                        ].map(item => (
                            <button key={item.label} className="toolbar-dropdown-item" onClick={item.action}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="toolbar-separator" />

            {/* Drawing tools */}
            <div className="toolbar-group">
                {drawTools.map(t => <ToolButton key={t.id} {...t} />)}
            </div>

            <div className="toolbar-separator" />

            {/* Text tools */}
            <div className="toolbar-group">
                {textTools.map(t => <ToolButton key={t.id} {...t} />)}
            </div>

            <div className="toolbar-separator" />

            {/* Shape tools */}
            <div className="toolbar-group">
                {shapeTools.map(s => <ToolButton key={s.id} {...s} />)}
            </div>

            <div className="toolbar-separator" />

            {/* Undo / Redo */}
            <div className="toolbar-group">
                <button className="toolbar-btn" title="Undo (Ctrl+Z)" onClick={undo}><Undo2 size={14} /></button>
                <button className="toolbar-btn" title="Redo (Ctrl+Y)" onClick={redo}><Redo2 size={14} /></button>
            </div>

            <div className="toolbar-separator" />

            {/* Zoom */}
            <div className="toolbar-group">
                <button className="toolbar-btn" title="Zoom Out" onClick={zoomOut}><ZoomOut size={14} /></button>
                <button className="toolbar-btn" title="Zoom In" onClick={zoomIn}><ZoomIn size={14} /></button>
            </div>

            <div className="toolbar-separator" />

            {/* Page + Clear */}
            <div className="toolbar-group">
                <button className="toolbar-btn" title="Add Page" onClick={() => editor?.createPage({ name: `Page ${(editor.getPages().length + 1)}` })}>
                    <Plus size={14} />
                </button>
                <button className="toolbar-btn" title="Clear Board" onClick={clearBoard}><Trash2 size={14} /></button>
            </div>

            <div style={{ flex: 1 }} />

            {/* Right-side actions */}
            <div className="toolbar-group">
                {/* Theme toggle */}
                <button className="toolbar-btn" title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`} onClick={onToggleTheme}>
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                {/* Focus Mode */}
                <button className="toolbar-btn" title="Study / Focus Mode" onClick={onToggleFocusMode}>
                    <Eye size={14} />
                </button>

                {/* Save */}
                <button
                    className={`toolbar-btn ${isDirty ? "active" : ""}`}
                    title="Save (Ctrl+S)"
                    onClick={onSave}
                >
                    <Save size={14} />
                </button>

                {/* Export */}
                <div style={{ position: "relative" }} ref={exportRef}>
                    <button className="toolbar-btn" onClick={() => setShowExport(!showExport)}>
                        <Download size={14} />
                        <ChevronDown size={10} />
                    </button>
                    {showExport && (
                        <div className="toolbar-dropdown right">
                            {(["png", "jpg", "svg"] as const).map(f => (
                                <button key={f} className="toolbar-dropdown-item"
                                    onClick={() => { onExport(f); setShowExport(false); }}>
                                    Export as {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar toggle */}
                <button
                    className={`toolbar-btn ${isSidebarOpen ? "active" : ""}`}
                    title="Toggle Sidebar"
                    onClick={onToggleSidebar}
                >
                    <PanelRight size={14} />
                </button>
            </div>
        </div>
    );
}
