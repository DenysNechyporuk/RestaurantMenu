import { useEffect, useRef, useState } from "react";
import "../app.css";

const API_URL = "http://localhost:5046";
const STATUS_OPTIONS = [
    { value: "New", label: "Нові" },
    { value: "InProgress", label: "Готується" },
    { value: "Done", label: "Готово" },
    { value: "Cancelled", label: "Відмінено" },
];

function statusToText(s) {
    if (s === 0) return "Новий";
    if (s === 1) return "Готується";
    if (s === 2) return "Готово";
    if (s === 3) return "Відмінено";
    return String(s);
}

export default function AdminOrdersPage() {
    const [statuses, setStatuses] = useState(["New"]);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const lastIds = useRef(new Set());

    const fetchOrders = async () => {
        try {
            setError("");
            const query = new URLSearchParams();
            for (const currentStatus of statuses) {
                query.append("statuses", currentStatus);
            }

            const res = await fetch(`${API_URL}/api/admin/orders?${query.toString()}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setOrders(data);

            const nowIds = new Set(data.map((x) => x.id));
            let hasNew = false;
            for (const id of nowIds) {
                if (!lastIds.current.has(id)) hasNew = true;
            }
            lastIds.current = nowIds;
            if (hasNew && statuses.includes("New")) {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g); g.connect(ctx.destination);
                    o.frequency.value = 880;
                    g.gain.value = 0.05;
                    o.start();
                    setTimeout(() => { o.stop(); ctx.close(); }, 120);
                } catch {}
            }
        } catch (e) {
            setError(String(e));
        }
    };

    useEffect(() => {
        fetchOrders();
        const t = setInterval(fetchOrders, 2000);
        return () => clearInterval(t);
    }, [statuses]);

    const updateStatus = async (id, newStatusNumber) => {
        const res = await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatusNumber }),
        });
        if (!res.ok) {
            setError(await res.text());
            return;
        }
        fetchOrders();
    };

    const toggleStatus = (statusValue) => {
        setStatuses((current) =>
            current.includes(statusValue)
                ? current.filter((item) => item !== statusValue)
                : [...current, statusValue]
        );
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
                        <div className="brandSub">Адмін • замовлення</div>
                    </div>
                </div>
                <div className="topLinks">
                    <a className="topLink" href="/admin/menu">Товари</a>
                    <a className="topLink" href="/admin/qr">QR</a>
                    <button
                        className="btn btnGhost"
                        onClick={() => {
                            localStorage.removeItem("admin_auth");
                            window.location.href = "/";
                        }}
                    >
                        Вийти
                    </button>
                </div>
            </header>

            <main style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
                {error && <div className="alert">Помилка: {error}</div>}

                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                    <div className="pill">Фільтр статусу</div>
                    <div className="statusFilterBox">
                        {STATUS_OPTIONS.map((option) => (
                            <label key={option.value} className="statusCheckbox">
                                <input
                                    type="checkbox"
                                    checked={statuses.includes(option.value)}
                                    onChange={() => toggleStatus(option.value)}
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>

                    <button className="btn btnPrimary" onClick={fetchOrders}>
                        Оновити
                    </button>
                </div>

                {orders.length === 0 ? (
                    <div className="muted">Немає замовлень</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                        {orders.map((o) => (
                            <div key={o.id} className="card">
                                <div className="cardTop">
                                    <div className="cardTitle">Замовлення #{o.id} • Стіл {o.tableId}</div>
                                    <div className="pill">{statusToText(o.status)}</div>
                                </div>

                                <div className="mutedSmall" style={{ marginTop: 6 }}>
                                    {new Date(o.createdAtUtc).toLocaleString()}
                                </div>

                                {o.note && (
                                    <div style={{ marginTop: 8 }} className="mutedSmall">
                                        Коментар: {o.note}
                                    </div>
                                )}

                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                    {o.items.map((it, idx) => (
                                        <div key={idx} className="cartRow" style={{ margin: 0 }}>
                                            <div>
                                                <div className="cartItemName">{it.name}</div>
                                                <div className="mutedSmall">
                                                    {it.unitPrice} × {it.qty} = {it.lineTotal} грн
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="cartTotalRow">
                                    <div className="mutedSmall">Разом</div>
                                    <div className="total">{o.total} грн</div>
                                </div>

                                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                    <button className="btn btnGhost" onClick={() => updateStatus(o.id, 1)}>
                                        В роботу
                                    </button>
                                    <button className="btn btnPrimary" onClick={() => updateStatus(o.id, 2)}>
                                        Готово
                                    </button>
                                    <button className="btn btnDanger" onClick={() => updateStatus(o.id, 3)}>
                                        Скасувати
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
