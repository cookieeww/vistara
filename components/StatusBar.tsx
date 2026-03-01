"use client";

import React from "react";

interface StatusBarProps {
    message: string;
    filePath: string | null;
    isDirty: boolean;
}

export default function StatusBar({ message, filePath, isDirty }: StatusBarProps) {
    const fileName = filePath
        ? filePath.split(/[\\/]/).pop()
        : "Untitled Board";

    return (
        <div className="status-bar">
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                {fileName}{isDirty ? " ●" : ""}
            </span>
            <span style={{ color: "var(--border)", userSelect: "none" }}>|</span>
            <span>{message}</span>
            <span style={{ flex: 1 }} />
            <span>Vistara v0.1.0</span>
        </div>
    );
}
