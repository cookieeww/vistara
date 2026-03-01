"use client";

import React, { useState, useCallback } from "react";
import { Editor } from "@tldraw/tldraw";
import { CheckSquare, Layers, Sliders, Plus, Trash2 } from "lucide-react";
import { TodoItem } from "@/lib/persistence";

interface SidebarProps {
    todos: TodoItem[];
    onTodosChange: (todos: TodoItem[]) => void;
    notes: string;
    onNotesChange: (notes: string) => void;
    editor: Editor | null;
}

type Tab = "todos" | "layers" | "properties";

export default function Sidebar({ todos, onTodosChange, notes, onNotesChange, editor }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<Tab>("todos");
    const [newTodo, setNewTodo] = useState("");

    const addTodo = useCallback(() => {
        if (!newTodo.trim()) return;
        const item: TodoItem = {
            id: `todo-${Date.now()}`,
            text: newTodo.trim(),
            done: false,
            createdAt: new Date().toISOString(),
        };
        onTodosChange([...todos, item]);
        setNewTodo("");
    }, [newTodo, todos, onTodosChange]);

    const toggleTodo = (id: string) => {
        onTodosChange(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTodo = (id: string) => {
        onTodosChange(todos.filter(t => t.id !== id));
    };

    const tabs = [
        { id: "todos" as Tab, icon: <CheckSquare size={14} />, label: "Tasks" },
        { id: "layers" as Tab, icon: <Layers size={14} />, label: "Layers" },
        { id: "properties" as Tab, icon: <Sliders size={14} />, label: "Props" },
    ];

    return (
        <>
            <div className="sidebar-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`sidebar-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.label}
                    >
                        {tab.icon}
                        <span style={{ marginLeft: 4 }}>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="sidebar-panel">
                {activeTab === "todos" && (
                    <div>
                        <div className="todo-input-row">
                            <input
                                className="todo-input"
                                placeholder="Add task…"
                                value={newTodo}
                                onChange={e => setNewTodo(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addTodo()}
                            />
                            <button
                                onClick={addTodo}
                                style={{
                                    background: "var(--accent)", border: "none", borderRadius: 8,
                                    color: "white", padding: "8px 12px", cursor: "pointer", fontSize: 13
                                }}
                            >
                                <Plus size={15} />
                            </button>
                        </div>

                        {todos.length === 0 && (
                            <div style={{ color: "var(--text-secondary)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                                No tasks yet. Add one above!
                            </div>
                        )}

                        {todos.map(todo => (
                            <div key={todo.id} className={`todo-item ${todo.done ? "done" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={todo.done}
                                    onChange={() => toggleTodo(todo.id)}
                                />
                                <span className="todo-item-text">{todo.text}</span>
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 2 }}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}

                        {/* Quick notes */}
                        <div style={{ marginTop: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Quick Notes
                            </div>
                            <textarea
                                value={notes}
                                onChange={e => onNotesChange(e.target.value)}
                                placeholder="Jot down thoughts…"
                                style={{
                                    width: "100%", minHeight: 120, background: "rgba(255,255,255,0.04)",
                                    border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px",
                                    color: "var(--text-primary)", fontSize: 13, lineHeight: 1.6,
                                    resize: "vertical", outline: "none", fontFamily: "inherit"
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "layers" && (
                    <LayersPanel editor={editor} />
                )}

                {activeTab === "properties" && (
                    <PropertiesPanel editor={editor} />
                )}
            </div>
        </>
    );
}

// ── Layers Panel ────────────────────────────────────────────────────────────

function LayersPanel({ editor }: { editor: Editor | null }) {
    const shapes = editor ? Array.from(editor.getCurrentPageShapeIds()) : [];

    return (
        <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Shapes on page ({shapes.length})
            </div>
            {shapes.length === 0 && (
                <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Canvas is empty</div>
            )}
            {shapes.map((id, i) => {
                const shape = editor?.getShape(id);
                return (
                    <div key={id} style={{
                        padding: "6px 10px", borderRadius: 6, marginBottom: 4,
                        background: "rgba(255,255,255,0.04)", fontSize: 12, cursor: "pointer",
                        color: "var(--text-primary)", display: "flex", justifyContent: "space-between"
                    }}
                        onClick={() => editor?.select(id)}
                    >
                        <span>{shape?.type ?? "shape"}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{String(id).slice(-6)}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Properties Panel ────────────────────────────────────────────────────────

function PropertiesPanel({ editor }: { editor: Editor | null }) {
    const selectedIds = editor ? editor.getSelectedShapeIds() : [];
    const count = selectedIds.length;

    return (
        <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Properties
            </div>
            {count === 0 ? (
                <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Select a shape to see properties</div>
            ) : (
                <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 8 }}>
                        {count} shape{count > 1 ? "s" : ""} selected
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <PropRow label="Delete">
                            <button
                                onClick={() => editor?.deleteShapes(selectedIds)}
                                style={{
                                    background: "rgba(233,69,96,0.15)", border: "1px solid var(--accent)",
                                    borderRadius: 6, padding: "4px 12px", color: "var(--accent)",
                                    cursor: "pointer", fontSize: 12
                                }}
                            >
                                Delete selected
                            </button>
                        </PropRow>
                        <PropRow label="Duplicate">
                            <button
                                onClick={() => editor?.duplicateShapes(selectedIds)}
                                style={{
                                    background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
                                    borderRadius: 6, padding: "4px 12px", color: "var(--text-primary)",
                                    cursor: "pointer", fontSize: 12
                                }}
                            >
                                Duplicate
                            </button>
                        </PropRow>
                        <PropRow label="Bring forward">
                            <button
                                onClick={() => editor?.bringForward(selectedIds)}
                                style={{
                                    background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
                                    borderRadius: 6, padding: "4px 12px", color: "var(--text-primary)",
                                    cursor: "pointer", fontSize: 12
                                }}
                            >
                                Forward
                            </button>
                        </PropRow>
                    </div>
                </div>
            )}
        </div>
    );
}

function PropRow({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
            {children}
        </div>
    );
}
