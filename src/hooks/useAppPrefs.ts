import { useEffect, useState } from "react";
import { appLocale, tr, useLanguage } from "../i18n";
export function useAppPrefs() {
  const { language, setLanguage } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = appLocale();
    document.title = tr("Ostrava Pocket · Erasmus budget");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        tr(
          "Your Erasmus budget, one little adventure at a time. Private EUR and CZK expense tracking.",
        ),
      );
  }, [language]);
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("pocket-theme");
      return saved ? saved === "dark" : true;
    } catch {
      return true;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#00170f" : "#eaf5ee");
    try {
      localStorage.setItem("pocket-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem("pocket-view") === "week" ? "week" : "month";
    } catch {
      return "month";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("pocket-view", view);
    } catch {}
  }, [view]);
  return { language, setLanguage, dark, setDark, view, setView };
}
