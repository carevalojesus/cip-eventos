import { useEffect, useState } from "react";

export interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[] = []) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Toggle help modal with '?' (Shift + /)
      if (event.key === "?" && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // Close modal with Escape
      if (event.key === "Escape" && isHelpOpen) {
        setIsHelpOpen(false);
        return;
      }

      // Check custom shortcuts
      shortcuts.forEach((shortcut) => {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.altKey === !!shortcut.altKey
        ) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, isHelpOpen]);

  return { isHelpOpen, closeHelp: () => setIsHelpOpen(false) };
}
