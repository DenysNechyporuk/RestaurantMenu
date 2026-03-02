import { BrowserRouter, Routes, Route } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminTablesPage from "./pages/AdminTablesPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/menu" element={<AdminMenuPage />} />
                <Route path="/admin/tables" element={<AdminTablesPage />} />
            </Routes>
        </BrowserRouter>
    );
}