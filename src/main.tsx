import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AppThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionsProvider } from "./context/SubscriptionsContext"; // ADDED

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppThemeProvider>
      <AuthProvider>
        <SubscriptionsProvider>{/* ADDED — must be inside AuthProvider */}
          <App />
        </SubscriptionsProvider>{/* ADDED */}
      </AuthProvider>
    </AppThemeProvider>
  </StrictMode>
);