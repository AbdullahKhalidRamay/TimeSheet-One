import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SettingsContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

// Font size range: 12px to 24px
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [fontSize, setFontSizeState] = useState<number>(() => {
    const stored = localStorage.getItem("app-font-size");
    const parsedSize = stored ? parseInt(stored, 10) : DEFAULT_FONT_SIZE;
    return Math.min(Math.max(parsedSize, MIN_FONT_SIZE), MAX_FONT_SIZE);
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Update CSS custom properties for different text sizes
    const style = document.getElementById("dynamic-font-style") || document.createElement("style");
    style.id = "dynamic-font-style";
    style.textContent = `
      :root {
        --base-font-size: ${fontSize}px;
        --heading-font-size: ${Math.round(fontSize * 1.5)}px;
        --subheading-font-size: ${Math.round(fontSize * 1.25)}px;
        --caption-font-size: ${Math.round(fontSize * 0.875)}px;
        --small-font-size: ${Math.round(fontSize * 0.75)}px;
      }
      
      /* Apply font sizes to various elements */
      body, p, span, div:not(.text-heading):not(.text-subheading):not(.text-caption):not(.text-xs), 
      label, input, textarea, select, button, .text-body, .dynamic-text {
        font-size: var(--base-font-size) !important;
      }
      
      .text-heading, h1, h2 {
        font-size: var(--heading-font-size) !important;
      }
      
      .text-subheading, h3 {
        font-size: var(--subheading-font-size) !important;
      }
      
      .text-caption, .text-sm {
        font-size: var(--caption-font-size) !important;
      }
      
      .text-xs {
        font-size: var(--small-font-size) !important;
      }
      
      /* Adjust specific UI components */
      .dropdown-menu-item, .button-text {
        font-size: var(--base-font-size) !important;
      }
    `;
    
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
  }, [fontSize]);

  const setFontSize = (size: number) => {
    const clampedSize = Math.min(Math.max(size, MIN_FONT_SIZE), MAX_FONT_SIZE);
    setFontSizeState(clampedSize);
    localStorage.setItem("app-font-size", clampedSize.toString());
  };

  return (
    <SettingsContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export { MIN_FONT_SIZE, MAX_FONT_SIZE, DEFAULT_FONT_SIZE };
