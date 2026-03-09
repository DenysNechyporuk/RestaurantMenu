import { useMemo, useState } from "react";
import QRCode from "qrcode";
import "../app.css";

export default function AdminQrPage() {
    const [table, setTable] = useState(5);
    const [dataUrl, setDataUrl] = useState("");

    const url = useMemo(() => {
        const n = Number(table);
        const safe = Number.isFinite(n) && n > 0 ? n : 5;
        return `${window.location.origin}/?table=${safe}`;
    }, [table]);

    const generate = async () => {
        const img = await QRCode.toDataURL(url, { margin: 1, scale: 8 });
        setDataUrl(img);
    };

    const copy = async () => {
        await navigator.clipboard.writeText(url);
        alert("Посилання скопійовано ✅");
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
                        <div className="brandSub">Адмін • QR для столів</div>
                    </div>
                </div>

                <div className="topLinks">
                    <a className="topLink" href="/admin">Замовлення</a>
                    <a className="topLink" href="/admin/menu">Товари</a>
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

            <main style={{ padding: 18, maxWidth: 900, margin: "0 auto" }}>
                <div className="card">
                    <div className="cardTitle">Генератор QR</div>

                    <label className="label">Номер столу</label>
                    <input
                        className="input"
                        type="number"
                        min={1}
                        value={table}
                        onChange={(e) => setTable(e.target.value)}
                    />

                    <div className="mutedSmall" style={{ marginTop: 8 }}>
                        URL: {url}
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button className="btn btnPrimary" onClick={generate}>
                            Згенерувати
                        </button>
                        <button className="btn btnGhost" onClick={copy}>
                            Копіювати URL
                        </button>
                    </div>

                    {dataUrl && (
                        <div style={{ marginTop: 14 }}>
                            <img
                                src={dataUrl}
                                alt="QR"
                                style={{
                                    width: 260,
                                    borderRadius: 14,
                                    border: "1px solid rgba(255,255,255,.08)",
                                }}
                            />
                            <div className="mutedSmall" style={{ marginTop: 6 }}>
                                ПКМ → Save image (збережи як картинку для друку)
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}