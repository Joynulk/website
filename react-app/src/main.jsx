import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { initApp } from "./store.js";
import "./styles.css";

initApp();

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <App />
  </HashRouter>
);
