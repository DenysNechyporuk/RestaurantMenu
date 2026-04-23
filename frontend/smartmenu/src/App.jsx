import { useEffect, useMemo, useState } from "react";
import "./app.css";

const API_URL = "http://localhost:5046";
const toAssetUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_URL}${value}`;
};

function getTableFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("table");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 5;
}

export default function App() {
    const [tableId] = useState(getTableFromUrl());
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");

    const total = useMemo(
        () => cart.reduce((sum, x) => sum + x.price * x.qty, 0),
        [cart]
    );

    useEffect(() => {
        setLoading(true);
        setError("");

        fetch(`${API_URL}/api/menu?tableId=${tableId}`)
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then(setCategories)
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, [tableId]);

    const add = (item) => {
        setCart((prev) => {
            const found = prev.find((x) => x.menuItemId === item.id);
            if (found) {
                return prev.map((x) =>
                    x.menuItemId === item.id ? { ...x, qty: x.qty + 1 } : x
                );
            }
            return [
                ...prev,
                { menuItemId: item.id, name: item.name, price: item.price, qty: 1 },
            ];
        });
    };

    const inc = (id) =>
        setCart((prev) =>
            prev.map((x) => (x.menuItemId === id ? { ...x, qty: x.qty + 1 } : x))
        );

    const dec = (id) =>
        setCart((prev) =>
            prev
                .map((x) => (x.menuItemId === id ? { ...x, qty: x.qty - 1 } : x))
                .filter((x) => x.qty > 0)
        );

    const clear = () => setCart([]);

    const placeOrder = async () => {
        if (cart.length === 0 || placing) return;

        setPlacing(true);
        setError("");

        const body = {
            tableId,
            note,
            items: cart.map((x) => ({ menuItemId: x.menuItemId, qty: x.qty })),
        };

        try {
            const res = await fetch(`${API_URL}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(await res.text());

            alert("✅ Замовлення відправлено!");
            setCart([]);
            setNote("");
        } catch (e) {
            setError(String(e));
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="app">
            <header className="topbar">
                <div className="brand">
                    <span className="brandDot" />
                    <div className="brandText">
                        <div className="brandName">Roland Larper</div>
                        <div className="brandSub">Меню • стіл №{tableId}</div>
                    </div>
                </div>

                <div className="topLinks">
                    <a className="topLink" href="/admin" onClick={(e) => e.preventDefault()}>
                        Адмін
                    </a>
                    <div className="topLinkMuted">Кошик: {total} грн</div>
                </div>
            </header>

            <main className="layout">
                <section className="menuCol">
                    {error && <div className="alert">Помилка: {error}</div>}

                    {loading ? (
                        <div className="muted">Завантаження меню…</div>
                    ) : (
                        categories.map((cat) => (
                            <div key={cat.id} className="section">
                                <h2 className="sectionTitle">{cat.name}</h2>

                                <div className="grid">
                                    {cat.items.map((item) => (
                                        <div key={item.id} className="card">
                                            {item.imageUrl && (
                                                <img
                                                    className="cardImg"
                                                    src={toAssetUrl(item.imageUrl)}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        // якщо шлях битий — просто сховати картинку
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            )}
                                            <div className="cardTop">
                                                <div className="cardTitle">{item.name}</div>
                                                <div className="price">{item.price} грн</div>
                                            </div>

                                            <div className="cardDesc">
                                                {item.description || " "}
                                            </div>

                                            <div className="cardBottom">
                                                <div className="pill">
                                                    {item.isAvailable ? "В наявності" : "Немає"}
                                                </div>

                                                <button
                                                    className="btn btnPrimary"
                                                    onClick={() => add(item)}
                                                    disabled={!item.isAvailable}
                                                >
                                                    Додати
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <aside className="cartCol">
                    <div className="cartBox">
                        <div className="cartTitle">Кошик</div>

                        {cart.length === 0 ? (
                            <div className="muted">Порожньо</div>
                        ) : (
                            <div className="cartList">
                                {cart.map((x) => (
                                    <div key={x.menuItemId} className="cartRow">
                                        <div className="cartRowLeft">
                                            <div className="cartItemName">{x.name}</div>
                                            <div className="mutedSmall">
                                                {x.price} × {x.qty} = {x.price * x.qty} грн
                                            </div>
                                        </div>

                                        <div className="qty">
                                            <button className="btn btnGhost" onClick={() => dec(x.menuItemId)}>-</button>
                                            <div className="qtyNum">{x.qty}</div>
                                            <button className="btn btnGhost" onClick={() => inc(x.menuItemId)}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="cartTotalRow">
                            <div className="mutedSmall">Разом</div>
                            <div className="total">{total} грн</div>
                        </div>

                        <label className="label">Коментар до замовлення</label>
                        <input
                            className="input"
                            placeholder="Напр., без цибулі"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />

                        <button
                            className="btn btnWide btnPrimary"
                            onClick={placeOrder}
                            disabled={cart.length === 0 || placing}
                        >
                            {placing ? "Відправляю…" : "Замовити"}
                        </button>

                        {cart.length > 0 && (
                            <button className="btn btnWide btnDanger" onClick={clear}>
                                Очистити
                            </button>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}
