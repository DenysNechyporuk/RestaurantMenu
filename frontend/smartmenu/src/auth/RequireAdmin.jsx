import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
    const ok = localStorage.getItem("admin_auth") === "1";
    if (!ok) return <Navigate to="/" replace />;
    return children;
}