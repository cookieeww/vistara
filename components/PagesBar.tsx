"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@tldraw/tldraw";
import { Plus } from "lucide-react";

interface PagesBarProps {
    editor: Editor | null;
}

export default function PagesBar({ editor }: PagesBarProps) {
    const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
    const [currentPageId, setCurrentPageId] = useState<string>("");

    useEffect(() => {
        if (!editor) return;
        const updatePages = () => {
            setPages(editor.getPages().map(p => ({ id: p.id, name: p.name })));
            setCurrentPageId(editor.getCurrentPageId());
        };
        updatePages();
        const unsub = editor.store.listen(updatePages, { source: "all", scope: "all" });
        return () => unsub();
    }, [editor]);

    const switchPage = (id: string) => {
        editor?.setCurrentPage(id as any);
        setCurrentPageId(id);
    };

    const addPage = () => {
        if (!editor) return;
        editor.createPage({ name: `Page ${pages.length + 1}` });
    };

    if (pages.length <= 1) return null;

    return (
        <div className="pages-bar">
            {pages.map(page => (
                <button
                    key={page.id}
                    className={`page-chip ${currentPageId === page.id ? "active" : ""}`}
                    onClick={() => switchPage(page.id)}
                >
                    {page.name}
                </button>
            ))}
            <button
                className="page-chip"
                onClick={addPage}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
                <Plus size={11} /> Page
            </button>
        </div>
    );
}
