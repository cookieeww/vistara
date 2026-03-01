"use client";

import { useRef, useCallback, useEffect } from "react";

// mediaSink — ensures only one audio/video source plays at a time
let activeElement: HTMLMediaElement | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
    listeners.forEach((fn) => fn());
}

export const mediaSink = {
    acquire(el: HTMLMediaElement) {
        if (activeElement && activeElement !== el) {
            activeElement.pause();
        }
        activeElement = el;
        notifyListeners();
    },
    release(el: HTMLMediaElement) {
        if (activeElement === el) {
            activeElement = null;
            notifyListeners();
        }
    },
    isActive(el: HTMLMediaElement) {
        return activeElement === el;
    },
    subscribe(fn: () => void) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};

export function useIntersectionPause(ref: React.RefObject<HTMLMediaElement | null>) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    el.pause();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
}
