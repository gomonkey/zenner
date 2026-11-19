import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClientProvider, queryClient } from "@zenner/core/api/queryClient";
import { App } from "./App";
import { initI18n } from "@zenner/core/locale/config/index";
import "./index.css";

// Initialize multi-language engine
initI18n("vi");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
