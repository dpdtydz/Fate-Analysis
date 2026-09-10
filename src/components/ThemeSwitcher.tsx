import React, { useState, useEffect, useRef } from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";

export type ThemeId = "baekja" | "obsidian" | "dancheong";

interface ThemeOption {
  id: ThemeId;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  bgHex: string;
  borderHex: string;
  accentHex: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "baekja",
    name: "백자 · 한지",
    tagline: "맑고 정갈한 조선 백자와 닥나무 한지의 낮",
    icon: <Sun className="w-3.5 h-3.5 text-amber-600" />,
    bgHex: "#FCFCFA",
    borderHex: "#E7E7E2",
    accentHex: "#B3382C",
  },
  {
    id: "obsidian",
    name: "달빛 흑요석",
    tagline: "깊은 밤하늘의 흑요석과 은은한 달빛의 조화",
    icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
    bgHex: "#0B0E14",
    borderHex: "#253248",
    accentHex: "#FF5A36",
  },
  {
    id: "dancheong",
    name: "궁궐 단청",
    tagline: "처마 아래 옥청과 은은한 쑥빛, 기품 있는 단홍",
    icon: <Palette className="w-3.5 h-3.5 text-emerald-400" />,
    bgHex: "#0A1513",
    borderHex: "#25443E",
    accentHex: "#E54D3C",
  },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("inyeon_theme") as ThemeId;
      if (saved && ["baekja", "obsidian", "dancheong"].includes(saved)) {
        return saved;
      }
    }
    return "baekja";
  });

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Apply theme to <html> tag and persist to localStorage
  const applyTheme = (theme: ThemeId) => {
    setCurrentTheme(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("inyeon_theme", theme);
      if (theme === "baekja") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentTheme === "baekja") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", currentTheme);
      }
    }
  }, [currentTheme]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Theme Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-8 px-2.5 rounded-xl bg-sunken hover:bg-line text-ink flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer border border-line/60"
        title="스킨 테마 변경"
        aria-label="스킨 테마 변경"
      >
        <span>{activeOption.icon}</span>
        <span className="hidden sm:inline text-ink-soft text-[11px] font-medium">
          {activeOption.name}
        </span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-line shadow-2xl p-2 z-50 animate-fade-in text-left">
          <div className="px-2.5 py-1.5 mb-1 border-b border-line/50">
            <p className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-seal" />
              <span>한국적 미학 테마 스킨</span>
            </p>
            <p className="text-[10.5px] text-ink-faint mt-0.5">
              취향에 맞게 앱의 전통 색채 무드를 선택해 보세요
            </p>
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((option) => {
              const isSelected = currentTheme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => applyTheme(option.id)}
                  className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-sunken border border-line shadow-xs"
                      : "hover:bg-sunken/60"
                  }`}
                >
                  {/* Visual Color Preview Pill */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs border relative"
                    style={{
                      backgroundColor: option.bgHex,
                      borderColor: option.borderHex,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: option.accentHex }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-ink">
                        {option.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-seal shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-ink-faint truncate leading-tight mt-0.5">
                      {option.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
