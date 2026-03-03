import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../app.css";

export default function LandingPage() {
    const nav = useNavigate();
    const [table, setTable] = useState(5);
    const [pass, setPass] = useState("");
    const [err, setErr] = useState("");

    const goGuest = () => {
        const n = Number(table);
        if (!Number.isFinite(n) || n <= 0) return setErr("Невірний номер столу");
        nav(`/?table=${n}`);
    };

    const login = () => {
        if (pass === "admin") {
            localStorage.setItem("admin_auth", "1");
            nav("/admin");
        } else {
            setErr("Невірний пароль");
        }
    };

    return (
        <div className="app">
            <header className="topbar">
                <div className="brand">
                    <span className="brandDot" />
                    <div className="brandText">
                        <div className="brandName">Roland Larper</div>
                        <div className="brandSub">Локальне меню ресторану</div>
                    </div>
                </div>
            </header>

            <main style={{ padding: 18, maxWidth: 860, margin: "0 auto" }}>
                {err && <div className="alert">Помилка: {err}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="card">
                        <div className="cardTitle">Гість</div>
                        <div className="mutedSmall" style={{ marginTop: 6 }}>
                            Введи номер столу або скануй QR.
                        </div>

                        <label className="label">Номер столу</label>
                        <input
                            className="input"
                            type="number"
                            min={1}
                            value={table}
                            onChange={(e) => setTable(e.target.value)}
                        />

                        <button className="btn btnWide btnPrimary" onClick={goGuest}>
                            Відкрити меню
                        </button>
                    </div>

                    <div className="card">
                        <div className="cardTitle">Адмін</div>
                        <div className="mutedSmall" style={{ marginTop: 6 }}>
                            Пароль фіксований для курсової.
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
                </div>
            </main>
        </div>
    );
}