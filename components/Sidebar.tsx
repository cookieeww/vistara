"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tldraw/tldraw";
import {
    CheckSquare, Layers, Sliders, Plus, Trash2,
    Timer, Play, Pause, RotateCcw
} from "lucide-react";
import { TodoItem } from "@/lib/persistence";

interface SidebarProps {
    todos: TodoItem[];
    onTodosChange: (todos: TodoItem[]) => void;
    notes: string;
    onNotesChange: (notes: string) => void;
    editor: Editor | null;
}

type Tab = "todos" | "layers" | "properties" | "pomodoro";
type PomodoroMode = "work" | "short" | "long";

const POMODORO_TIMES: Record<PomodoroMode, number> = {
    work: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
};

const POMODORO_LABELS: Record<PomodoroMode, string> = {
    work: "Focus",
    short: "Short Break",
    long: "Long Break",
};

export default function Sidebar({ todos, onTodosChange, notes, onNotesChange, editor }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<Tab>("todos");
    const [newTodo, setNewTodo] = useState("");

    // Pomodoro state
    const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("work");
    const [timeLeft, setTimeLeft] = useState(POMODORO_TIMES.work);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Pomodoro timer logic
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        if (pomodoroMode === "work") {
                            setSessions((s) => s + 1);
                        }
                        // Play a subtle notification sound
                        try {
                            const ctx = new AudioContext();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.frequency.value = 800;
                            gain.gain.value = 0.1;
                            osc.start();
                            setTimeout(() => { osc.stop(); ctx.close(); }, 200);
                        } catch { /* ignore audio errors */ }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, pomodoroMode]);

    const switchPomodoroMode = (mode: PomodoroMode) => {
        setPomodoroMode(mode);
        setTimeLeft(POMODORO_TIMES[mode]);
        setIsRunning(false);
    };

    const resetTimer = () => {
        setTimeLeft(POMODORO_TIMES[pomodoroMode]);
        setIsRunning(false);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Todo handlers
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
        { id: "todos" as Tab, icon: <CheckSquare size={13} />, label: "Tasks" },
        { id: "pomodoro" as Tab, icon: <Timer size={13} />, label: "Timer" },
        { id: "layers" as Tab, icon: <Layers size={13} />, label: "Layers" },
        { id: "properties" as Tab, icon: <Sliders size={13} />, label: "Props" },
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
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="sidebar-panel">
                {/* ── Tasks Tab ── */}
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
                            <button className="todo-add-btn" onClick={addTodo}>
                                <Plus size={14} />
                            </button>
                        </div>

                        {todos.length === 0 && (
                            <div className="empty-state">No tasks yet. Add one above!</div>
                        )}

                        {todos.map(todo => (
                            <div key={todo.id} className={`todo-item ${todo.done ? "done" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={todo.done}
                                    onChange={() => toggleTodo(todo.id)}
                                />
                                <span className="todo-item-text">{todo.text}</span>
                                <button className="todo-item-delete" onClick={() => deleteTodo(todo.id)}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}

                        {/* Quick notes */}
                        <div style={{ marginTop: 20 }}>
                            <div className="sidebar-section-label">Quick Notes</div>
                            <textarea
                                className="quick-notes-area"
                                value={notes}
                                onChange={e => onNotesChange(e.target.value)}
                                placeholder="Jot down thoughts…"
                            />
                        </div>
                    </div>
                )}

                {/* ── Pomodoro Tab ── */}
                {activeTab === "pomodoro" && (
                    <div className="pomodoro-container">
                        <div className="pomodoro-label">{POMODORO_LABELS[pomodoroMode]}</div>
                        <div className="pomodoro-display">{formatTime(timeLeft)}</div>

                        <div className="pomodoro-modes">
                            {(["work", "short", "long"] as PomodoroMode[]).map(mode => (
                                <button
                                    key={mode}
                                    className={`pomodoro-mode-btn ${pomodoroMode === mode ? "active" : ""}`}
                                    onClick={() => switchPomodoroMode(mode)}
                                >
                                    {mode === "work" ? "Focus" : mode === "short" ? "Short" : "Long"}
                                </button>
                            ))}
                        </div>

                        <div className="pomodoro-controls">
                            <button
                                className="pomodoro-btn primary"
                                onClick={() => setIsRunning(!isRunning)}
                            >
                                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                                <span style={{ marginLeft: 6 }}>{isRunning ? "Pause" : "Start"}</span>
                            </button>
                            <button className="pomodoro-btn" onClick={resetTimer}>
                                <RotateCcw size={14} />
                            </button>
                        </div>

                        <div className="pomodoro-sessions">
                            {sessions} session{sessions !== 1 ? "s" : ""} completed
                        </div>
                    </div>
                )}

                {/* ── Layers Tab ── */}
                {activeTab === "layers" && <LayersPanel editor={editor} />}

                {/* ── Properties Tab ── */}
                {activeTab === "properties" && <PropertiesPanel editor={editor} />}
            </div>
        </>
    );
}

// ── Layers Panel ────────────────────────────────────────────────────────────

function LayersPanel({ editor }: { editor: Editor | null }) {
    const shapes = editor ? Array.from(editor.getCurrentPageShapeIds()) : [];

    return (
        <div>
            <div className="sidebar-section-label">
                Shapes on page ({shapes.length})
            </div>
            {shapes.length === 0 && (
                <div className="empty-state">Canvas is empty</div>
            )}
            {shapes.map((id) => {
                const shape = editor?.getShape(id);
                return (
                    <div key={id} style={{
                        padding: "5px 8px", borderRadius: "var(--radius)", marginBottom: 2,
                        background: "var(--accent-muted)", fontSize: 11, cursor: "pointer",
                        color: "var(--text-primary)", display: "flex", justifyContent: "space-between"
                    }}
                        onClick={() => editor?.select(id)}
                    >
                        <span>{shape?.type ?? "shape"}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{String(id).slice(-6)}</span>
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
            <div className="sidebar-section-label">Properties</div>
            {count === 0 ? (
                <div className="empty-state">Select a shape to see properties</div>
            ) : (
                <div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 10 }}>
                        {count} shape{count > 1 ? "s" : ""} selected
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div className="prop-row">
                            <span className="prop-label">Delete</span>
                            <button className="prop-btn danger" onClick={() => editor?.deleteShapes(selectedIds)}>
                                Delete
                            </button>
                        </div>
                        <div className="prop-row">
                            <span className="prop-label">Duplicate</span>
                            <button className="prop-btn" onClick={() => editor?.duplicateShapes(selectedIds)}>
                                Duplicate
                            </button>
                        </div>
                        <div className="prop-row">
                            <span className="prop-label">Z-Order</span>
                            <div style={{ display: "flex", gap: 4 }}>
                                <button className="prop-btn" onClick={() => editor?.bringForward(selectedIds)}>↑</button>
                                <button className="prop-btn" onClick={() => editor?.sendBackward(selectedIds)}>↓</button>
                                <button className="prop-btn" onClick={() => editor?.bringToFront(selectedIds)}>⬆</button>
                                <button className="prop-btn" onClick={() => editor?.sendToBack(selectedIds)}>⬇</button>
                            </div>
                        </div>
                        <div className="prop-row">
                            <span className="prop-label">Group</span>
                            <div style={{ display: "flex", gap: 4 }}>
                                <button className="prop-btn" onClick={() => editor?.groupShapes(selectedIds)}>Group</button>
                                <button className="prop-btn" onClick={() => editor?.ungroupShapes(selectedIds)}>Ungroup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
