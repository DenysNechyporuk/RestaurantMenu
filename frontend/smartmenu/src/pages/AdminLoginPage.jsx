

import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import "../app.css";

export default function AdminLoginPage() {
    const nav = useNavigate();
    const [table, setTable] = useState(5);
    const [pass, setPass] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {})
    const login = () => {
        if (pass === "admin") {
            localStorage.setItem("admin_auth", "1");
            nav("/admin/orders");
        } else {
            setErr("Невірний пароль");
        }
    };

    return (
        <div className="app">
            {console.log("Rendering AdminLoginPage")}
            <header className="topbar">
                <div className="brand">
                    <img
                        src="/favicon.png"
                        alt="logo"
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            marginRight: 10
                        }}
                    />
                    <div className="brandText">
                        <div className="brandName">Roland Larper</div>
                        <div className="brandSub">Локальне меню ресторану</div>
                    </div>
                </div>
            </header>

            <main style={{ padding: 18, maxWidth: 500, margin: "0 auto" }}>
                {err && <div className="alert">Помилка: {err}</div>}

                <div className="card">
                    <div className="cardTitle">Адмін</div>
                    <div className="mutedSmall" style={{ marginTop: 6 }}>
                        Введіть пароль
                    </div>

                    <label className="label">Пароль</label>
                    <input
                        className="input"
                        type="password"
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        placeholder="admin"
                    />

                    <button className="btn btnWide btnPrimary" onClick={login}>
                        Увійти
                    </button>
                </div>

                
            </main>
        </div>
    );
}