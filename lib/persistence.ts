import type { TLEditorSnapshot } from "@tldraw/tldraw";

export type VistaraSnapshot = TLEditorSnapshot | Record<string, unknown>;

export interface VistaraFile {
    version: number;
    snapshot: VistaraSnapshot;
    assets: Record<string, string>; // name → object URL / relative path
    todos: TodoItem[];
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: string;
}

const FILE_VERSION = 1;

export function createVistaraFile(
    snapshot: VistaraSnapshot,
    assets: Record<string, string>,
    todos: TodoItem[],
    notes: string
): VistaraFile {
    const now = new Date().toISOString();
    return {
        version: FILE_VERSION,
        snapshot,
        assets,
        todos,
        notes,
        createdAt: now,
        updatedAt: now,
    };
}

export function serializeVistaraFile(file: VistaraFile): string {
    return JSON.stringify(file, null, 2);
}

export function deserializeVistaraFile(json: string): VistaraFile {
    const obj = JSON.parse(json);
    if (!obj.version || !obj.snapshot) {
        throw new Error("Invalid .vistara file");
    }
    return obj as VistaraFile;
}
