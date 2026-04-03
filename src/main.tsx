import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@arcgis/core/assets/esri/themes/light/main.css";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
