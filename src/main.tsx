import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ContextMenuProvider } from "./ContextMenuContext";
import { I18nProvider, useI18n } from "./I18nContext";
import { LocaleProvider } from "@chakra-ui/react";

function AppWithI18n() {
  const { language } = useI18n();
  return (
    <LocaleProvider locale={language === "ja" ? "ja-JP" : "en-US"}>
      <App />
    </LocaleProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <ContextMenuProvider>
        <AppWithI18n />
      </ContextMenuProvider>
    </I18nProvider>
  </React.StrictMode>
);
