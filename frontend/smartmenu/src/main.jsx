import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./index.css";

import LandingPage from "./pages/LandingPage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import AdminMenuPage from "./pages/AdminMenuPage.jsx";
import AdminQrPage from "./pages/AdminQrPage.jsx";
import RequireAdmin from "./auth/RequireAdmin.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";

function RootRoute() {
    const loc = useLocation();
    const params = new URLSearchParams(loc.search);
    const table = params.get("table");

    // якщо зайшли з QR (є ?table=...) → гість
    if (table) return <MenuPage />;

    // якщо просто зайшли на "/" → маленьке меню з паролем
    return <LandingPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootRoute />} />

                <Route
                    path="/admin"
                    element={
                        <AdminLoginPage />
                    }
                />
                
                <Route
                    path="/admin/orders"
                    element={
                        <RequireAdmin>
                            <AdminOrdersPage />
                        </RequireAdmin>
                    }
                />
                
                <Route
                    path="/admin/menu"
                    element={
                        <RequireAdmin>
                            <AdminMenuPage />
                        </RequireAdmin>
                    }
                />

                <Route
                    path="/admin/qr"
                    element={
                        <RequireAdmin>
                            <AdminQrPage />
                        </RequireAdmin>
                    }
                />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);