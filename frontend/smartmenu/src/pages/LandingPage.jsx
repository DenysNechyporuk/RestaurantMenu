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
    

    return (
        <div className="app">
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

            <main style={{ padding: 18, maxWidth: 860, margin: "0 auto" }}>
                {err && <div className="alert">Помилка: {err}</div>}

                <div style={{ maxWidth: 400, margin: "0 auto" }}>
                    <div className="card">
                        <div className="cardTitle">Гість</div>
                        <div className="mutedSmall" style={{ marginTop: 6 }}>
                            Введи номер столу.
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

                    
                </div>
            </main>
        </div>
    );
}