// Этот компонент является основной точкой входа для React-приложения.
// Он управляет маршрутизацией, состоянием аутентификации и отображением основных компонентов.
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Signin from "./pages/Signin";
import Schedule from "./pages/Schedule";
import Clients from "./pages/Clients";
import Home from "./pages/Home";
import Team from "./pages/Team";
import useToken from "./components/useToken";
import Navbar from "./components/Navbar";
import History from "./pages/History";
import ChatWidget from "./components/ChatWidget";
import axios from "axios";
import AdminGate from "./components/AdminGate";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminClientDetails from "./pages/admin/AdminClientDetails";
import AdminChat from "./pages/admin/AdminChat";

function App() {
  // Кастомный хук для управления токеном аутентификации
  const { token, removeToken, setToken } = useToken();
  // Состояние для хранения ID текущего пользователя
  const [userId, setUserId] = useState(null);
  // Состояние для хранения статуса администратора текущего пользователя
  const [isAdmin, setIsAdmin] = useState(false);
  // Состояние для хранения ID получателя в чате
  const [recipientId, setRecipientId] = useState(null);
  // Состояние для управления видимостью виджета чата
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Получение профиля пользователя при наличии токена
  useEffect(() => {
    if (token) {
      axios.get("https://graduation-backend-v7om.onrender.com/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        setUserId(response.data.ID);
        setIsAdmin(response.data.Admin);
      })
      .catch(error => {
        console.error("Ошибка при загрузке профиля пользователя:", error);
      });
    }
  }, [token]);

  // Обработчик для открытия чата с указанным получателем
  const handleOpenChat = (recipientId: any) => {
    setRecipientId(recipientId);
    setIsChatOpen(true);
  };

  const handleOpenChatWidget = () => {
    setRecipientId(null);
    setIsChatOpen(true);
  };

  // Обработчик для закрытия чата
  const handleCloseChat = () => {
    setIsChatOpen(false);
    setRecipientId(null);
  };

  return (
    <BrowserRouter>
      {/* Проверяет, есть ли у пользователя токен, и выдает его, если статус токена не определен или пуст */}
      {!token && token !== "" && token !== undefined ? (
        <Signin setToken={setToken} />
      ) : (
        <>
          <Routes>
            {/* Перенаправляет пользователей на главную страницу из навигационной панели */}
            <Route
              path={"/*"}
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <Home
                    token={token}
                    removeToken={removeToken}
                    setToken={setToken}
                  />
                </>
              }
            />
            {/* Перенаправляет пользователей на страницу расписания из навигационной панели */}
            <Route
              path="/schedule"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <Schedule
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                  />
                </>
              }
            />
            {/* Перенаправляет пользователей на страницу клиентов из навигационной панели */}
            <Route
              path="/clients"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <Clients
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                  />
                </>
              }
            />
            <Route
              path="/history/:customerID"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <History
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                  />
                </>
              }
            />
            {/* Перенаправляет пользователей на страницу команды из навигационной панели */}
            <Route
              path="/team"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <Team
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    setRecipientId={handleOpenChat}
                  />
                </>
              }
            />
            <Route
              path="/admin"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <AdminGate token={token} removeToken={removeToken}>
                    <AdminDashboard token={token} />
                  </AdminGate>
                </>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <AdminGate token={token} removeToken={removeToken}>
                    <AdminClients token={token} />
                  </AdminGate>
                </>
              }
            />
            <Route
              path="/admin/clients/:clientId"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <AdminGate token={token} removeToken={removeToken}>
                    <AdminClientDetails token={token} />
                  </AdminGate>
                </>
              }
            />
            <Route
              path="/admin/chat"
              element={
                <>
                  <Navbar
                    token={token}
                    setToken={setToken}
                    removeToken={removeToken}
                    onOpenChat={handleOpenChatWidget}
                    userId={userId}
                  />
                  <AdminGate token={token} removeToken={removeToken}>
                    <AdminChat token={token} userId={userId} />
                  </AdminGate>
                </>
              }
            />
            <Route
              path="/dashboard"
              element={<Navigate to="/admin" replace />}
            />
            <Route
              path="/dashboard/*"
              element={<Navigate to="/admin" replace />}
            />
          </Routes>
          {/* Отображение виджета чата, если пользователь вошел в систему */}
          {userId && !isAdmin && (
            <ChatWidget
              userId={userId}
              recipientId={recipientId}
              isOpen={isChatOpen}
              onOpen={handleOpenChatWidget}
              onClose={handleCloseChat}
              token={token}
              isAdmin={isAdmin}
            />
          )}
        </>
      )}
    </BrowserRouter>
  );
}

export default App;
