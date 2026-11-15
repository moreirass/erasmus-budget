import { appLocale, tr } from "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
document.documentElement.lang = appLocale();
document.title = tr("Ostrava Pocket · Erasmus budget");
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("pocket-theme") === "light" ? "light" : "dark";
} catch {
  document.documentElement.dataset.theme = "dark";
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
