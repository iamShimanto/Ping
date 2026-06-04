import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { store } from "./store/store.ts";
import { ToastContainer } from "@repo/ui";
import SocketProvider from "./providers/SocketProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SocketProvider>
          <App />
          <ToastContainer />
        </SocketProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
