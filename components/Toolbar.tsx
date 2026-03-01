"use client";

import React, { useState } from "react";
import { Editor } from "@tldraw/tldraw";
import {
    MousePointer2, Pencil, Square, Type, Eraser,
    FolderOpen, Youtube, Undo2, Redo2,
    ZoomIn, ZoomOut, Maximize2, Trash2, EyeIcon,
    Save, Download, Plus, PanelRight, MoreHorizontal,
    ChevronDown
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
}

const tools = [
    { id: "select", icon: <MousePointer2 size={16} />, title: "Select (V)" },
    { id: "hand", icon: <span style={{ fontSize: 16 }}>✋</span>, title: "Hand / Pan (H)" },
    { id: "draw", icon: <Pencil size={16} />, title: "Pen (P)" },
    { id: "eraser", icon: <Eraser size={16} />, title: "Eraser (E)" },
    { id: "text", icon: <Type size={16} />, title: "Text (T)" },
];

const shapes = [
    { id: "geo", icon: <Square size={16} />, title: "Shapes" },
    { id: "line", icon: <span style={{ fontSize: 14, fontWeight: 700 }}>—</span>, title: "Line" },
    { id: "arrow", icon: <span style={{ fontSize: 14, fontWeight: 700 }}>→</span>, title: "Arrow" },
];

export default function Toolbar({
    activeTool, onSetTool, onNewBoard, onOpenBoard, onSave, onSaveAs,
    onExport, onToggleSidebar, onToggleFocusMode, isSidebarOpen, isDirty, editor
}: ToolbarProps) {
    const [showExport, setShowExport] = useState(false);
    const [showFile, setShowFile] = useState(false);

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
    const addPage = () => editor?.createPage({ name: `Page ${(editor.getPages().length + 1)}` });

    return (
        <div className="toolbar">
            {/* Logo */}
            <span className="toolbar-logo">Vistara</span>
            <div className="toolbar-separator" />

            {/* File menu */}
            <div style={{ position: "relative" }}>
                <button className="toolbar-btn" onClick={() => setShowFile(!showFile)}>
                    <FolderOpen size={15} />
                    File
                    <ChevronDown size={12} />
                </button>
                {showFile && (
                    <div className="animate-fadeIn" style={{
                        position: "absolute", top: "100%", left: 0, zIndex: 999,
                        background: "rgba(15,20,40,0.97)", backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                        padding: "6px", minWidth: 160, marginTop: 4,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                    }} onMouseLeave={() => setShowFile(false)}>
                        {[
                            { label: "New Board", action: () => { onNewBoard(); setShowFile(false); } },
                            { label: "Open Board…", action: () => { onOpenBoard(); setShowFile(false); } },
                            { label: isDirty ? "Save *" : "Save", action: () => { onSave(); setShowFile(false); } },
                            { label: "Save As…", action: () => { onSaveAs(); setShowFile(false); } },
                        ].map(item => (
                            <button key={item.label} className="toolbar-btn" style={{ width: "100%", justifyContent: "flex-start" }}
                                onClick={item.action}>{item.label}</button>
                        ))}
                    </div>
                )}
            </div>

            <div className="toolbar-separator" />

            {/* Drawing tools */}
            <div className="toolbar-group">
                {tools.map(t => (
                    <button
                        key={t.id}
                        className={`toolbar-btn ${activeTool === t.id ? "active" : ""}`}
                        title={t.title}
                        onClick={() => onSetTool(t.id)}
                    >
                        {t.icon}
                    </button>
                ))}
            </div>

            <div className="toolbar-separator" />

            {/* Shapes */}
            <div className="toolbar-group">
                {shapes.map(s => (
                    <button
                        key={s.id}
                        className={`toolbar-btn ${activeTool === s.id ? "active" : ""}`}
                        title={s.title}
                        onClick={() => onSetTool(s.id)}
                    >
                        {s.icon}
                    </button>
                ))}
            </div>

            <div className="toolbar-separator" />

            {/* Undo / Redo */}
            <div className="toolbar-group">
                <button className="toolbar-btn" title="Undo (Ctrl+Z)" onClick={undo}><Undo2 size={15} /></button>
                <button className="toolbar-btn" title="Redo (Ctrl+Y)" onClick={redo}><Redo2 size={15} /></button>
            </div>

            <div className="toolbar-separator" />

            {/* Zoom */}
            <div className="toolbar-group">
                <button className="toolbar-btn" title="Zoom Out" onClick={zoomOut}><ZoomOut size={15} /></button>
                <button className="toolbar-btn" title="Zoom In" onClick={zoomIn}><ZoomIn size={15} /></button>
            </div>

            <div className="toolbar-separator" />

            {/* Page controls */}
            <div className="toolbar-group">
                <button className="toolbar-btn" title="Add Page" onClick={addPage}><Plus size={15} /> Page</button>
                <button className="toolbar-btn" title="Clear Board" onClick={clearBoard}><Trash2 size={15} /></button>
            </div>

            <div style={{ flex: 1 }} />

            {/* Right-side actions */}
            <div className="toolbar-group">
                {/* Focus Mode */}
                <button className="toolbar-btn" title="Study / Focus Mode" onClick={onToggleFocusMode}>
                    <EyeIcon size={15} /> Focus
                </button>

                {/* Save */}
                <button
                    className={`toolbar-btn ${isDirty ? "active" : ""}`}
                    title="Save (Ctrl+S)"
                    onClick={onSave}
                >
                    <Save size={15} />
                    {isDirty ? "Save*" : "Save"}
                </button>

                {/* Export */}
                <div style={{ position: "relative" }}>
                    <button className="toolbar-btn" onClick={() => setShowExport(!showExport)}>
                        <Download size={15} /> Export <ChevronDown size={12} />
                    </button>
                    {showExport && (
                        <div className="animate-fadeIn" style={{
                            position: "absolute", top: "100%", right: 0, zIndex: 999,
                            background: "rgba(15,20,40,0.97)", backdropFilter: "blur(20px)",
                            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                            padding: "6px", minWidth: 130, marginTop: 4,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                        }} onMouseLeave={() => setShowExport(false)}>
                            {(["png", "jpg", "svg"] as const).map(f => (
                                <button key={f} className="toolbar-btn" style={{ width: "100%", justifyContent: "flex-start" }}
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
                    <PanelRight size={15} />
                </button>
            </div>
        </div>
    );
}
