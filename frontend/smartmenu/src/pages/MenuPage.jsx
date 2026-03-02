import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const API_URL = "http://localhost:5046";

function money(x) {
    return `${Math.round(x)} грн`;
}

export default function MenuPage() {
    const [sp] = useSearchParams();
    const table = Number(sp.get("table") || "0") || 0;

    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [note, setNote] = useState("");

    useEffect(() => {
        if (!table) return;
        fetch(`${API_URL}/api/menu?tableId=${table}`)
            .then((r) => r.json())
            .then(setCategories)
            .catch(console.error);
    }, [table]);

    const total = useMemo(
        () => cart.reduce((s, x) => s + x.price * x.qty, 0),
        [cart]
    );

    const add = (item) => {
        setCart((prev) => {
            const ex = prev.find((x) => x.menuItemId === item.id);
            if (ex) return prev.map((x) => (x.menuItemId === item.id ? { ...x, qty: x.qty + 1 } : x));
            return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1 }];
        });
    };

    const dec = (menuItemId) => {
        setCart((prev) => {
            const ex = prev.find((x) => x.menuItemId === menuItemId);
            if (!ex) return prev;
            if (ex.qty <= 1) return prev.filter((x) => x.menuItemId !== menuItemId);
            return prev.map((x) => (x.menuItemId === menuItemId ? { ...x, qty: x.qty - 1 } : x));
        });
    };

    const placeOrder = async () => {
        if (!table) return alert("Немає номера столу в URL. Має бути /menu?table=5");
        if (cart.length === 0) return;

        const body = {
            tableId: table,
            note,
            items: cart.map((x) => ({ menuItemId: x.menuItemId, qty: x.qty })),
        };

        const res = await fetch(`${API_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            alert("Замовлення відправлено!");
            setCart([]);
            setNote("");
        } else {
            alert(await res.text());
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0f0f10", color: "#f3f3f3" }}>
            {/* Header */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(15,15,16,0.9)", borderBottom: "1px solid #242427" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: "#e11d48" }} />
                        <div>
                            <div style={{ fontWeight: 800, letterSpacing: 0.5 }}>Poland Larper</div>
                            <div style={{ opacity: 0.8, fontSize: 13 }}>Меню • стіл №{table || "?"}</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Link to="/admin/orders" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>
                            Адмін
                        </Link>
                        <div style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #2a2a2e", background: "#151518" }}>
                            Кошик: <b>{money(total)}</b>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 18 }}>
                {/* Left: Categories */}
                <div>
                    {!table ? (
                        <div style={{ padding: 16, border: "1px solid #2a2a2e", borderRadius: 16, background: "#151518" }}>
                            У URL немає столу. Відкрий: <code>/menu?table=5</code>
                        </div>
                    ) : categories.length === 0 ? (
                        <div style={{ padding: 16, opacity: 0.85 }}>Завантаження меню…</div>
                    ) : (
                        categories.map((cat) => (
                            <div key={cat.id} style={{ marginBottom: 18 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, margin: "10px 0" }}>{cat.name}</div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                                    {cat.items.map((item) => (
                                        <div key={item.id} style={{ border: "1px solid #242427", borderRadius: 18, overflow: "hidden", background: "#151518" }}>
                                            <div
                                                style={{
                                                    height: 140,
                                                    background: item.imageUrl
                                                        ? `url(${item.imageUrl}) center/cover no-repeat`
                                                        : "linear-gradient(135deg, #222 0%, #111 60%)",
                                                }}
                                            />
                                            <div style={{ padding: 12 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                                    <div style={{ fontWeight: 800 }}>{item.name}</div>
                                                    <div style={{ fontWeight: 800, color: "#fb7185" }}>{money(item.price)}</div>
                                                </div>
                                                {item.description ? <div style={{ opacity: 0.75, fontSize: 13, marginTop: 6 }}>{item.description}</div> : null}

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                                                    <div style={{ opacity: 0.75, fontSize: 12 }}>{item.isAvailable ? "В наявності" : "Немає"}</div>
                                                    <button
                                                        disabled={!item.isAvailable}
                                                        onClick={() => add(item)}
                                                        style={{
                                                            border: 0,
                                                            padding: "8px 12px",
                                                            borderRadius: 12,
                                                            background: item.isAvailable ? "#e11d48" : "#333",
                                                            color: "white",
                                                            cursor: item.isAvailable ? "pointer" : "not-allowed",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Додати
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right: Cart */}
                <div style={{ position: "sticky", top: 76, alignSelf: "start" }}>
                    <div style={{ border: "1px solid #242427", borderRadius: 18, background: "#151518", padding: 14 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Кошик</div>

                        {cart.length === 0 ? (
                            <div style={{ opacity: 0.75 }}>Порожньо</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {cart.map((x) => (
                                    <div key={x.menuItemId} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
                                            <div style={{ opacity: 0.75, fontSize: 12 }}>{money(x.price)} • {x.qty} шт</div>
                                        </div>

                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <button onClick={() => dec(x.menuItemId)} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #2a2a2e", background: "#101012", color: "#fff" }}>−</button>
                                            <div style={{ width: 22, textAlign: "center" }}>{x.qty}</div>
                                            <button onClick={() => setCart(prev => prev.map(p => p.menuItemId === x.menuItemId ? { ...p, qty: p.qty + 1 } : p))}
                                                    style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #2a2a2e", background: "#101012", color: "#fff" }}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ borderTop: "1px solid #242427", margin: "12px 0" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
                            <div>Разом</div>
                            <div>{money(total)}</div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Коментар до замовлення</div>
                            <input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Напр. без цибулі"
                                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #2a2a2e", background: "#101012", color: "#fff" }}
                            />
                        </div>

                        <button
                            onClick={placeOrder}
                            disabled={cart.length === 0}
                            style={{
                                marginTop: 12,
                                width: "100%",
                                padding: "12px 14px",
                                borderRadius: 14,
                                border: 0,
                                background: cart.length === 0 ? "#333" : "#e11d48",
                                color: "white",
                                fontWeight: 900,
                                cursor: cart.length === 0 ? "not-allowed" : "pointer",
                            }}
                        >
                            Замовити
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}