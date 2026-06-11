import { Routes, Route, Navigate } from "react-router";
import { AuthBootstrap } from "./providers/AuthBootstrap";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import OAuthCallbackPage from "./pages/auth/OAuthCallbackPage";
import ChatLayout from "./pages/chat/ChatLayout";
import ChatsPage from "./pages/chat/pages/ChatsPage";
import ProfilePage from "./pages/chat/pages/ProfilePage";
import ContactsPage from "./pages/chat/pages/ContactsPage";
import CallsPage from "./pages/chat/pages/CallsPage";
import SettingsPage from "./pages/chat/pages/SettingsPage";
import BookmarksPage from "./pages/chat/pages/BookmarksPage";

function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<Navigate to="chats" replace />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="calls" element={<CallsPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthBootstrap>
  );
}

export default App;
