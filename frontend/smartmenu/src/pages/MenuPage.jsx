import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "../app.css";

const API_URL = "http://localhost:5046";

const toAssetUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_URL}${value}`;
};

function getErrorText(error) {
    return error instanceof Error ? error.message : String(error);
}

// приймає різні формати відповіді бекенда і приводить до 1 формату
function normalizeCategories(data) {
    const cats = Array.isArray(data) ? data : (data?.categories ?? []);
    if (!Array.isArray(cats)) return [];

    return cats
        .map((c) => {
            const items = c?.items ?? c?.menuItems ?? [];
            return {
                id: c.id,
                name: c.name ?? "",
                sortOrder: c.sortOrder ?? 0,
                items: Array.isArray(items) ? items : [],
            };
        })
        .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
}

function statusToText(status) {
    if (status === 0) return "Новий";
    if (status === 1) return "Готується";
    if (status === 2) return "Готово";
    if (status === 3) return "Відмінено";
    return String(status);
}

function orderToCart(order) {
    if (!order?.items || !Array.isArray(order.items)) return [];

    return order.items
        .map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name ?? "Товар",
            unitPrice: Number(item.unitPrice) || 0,
            qty: Number(item.qty) || 0,
        }))
        .filter((item) => item.qty > 0);
}

export default function MenuPage() {
    const loc = useLocation();
    const params = new URLSearchParams(loc.search);
    const tableId = Number(params.get("table") ?? params.get("tableId") ?? 0);

    const [error, setError] = useState("");
    const [menuLoaded, setMenuLoaded] = useState(false);

    const [categories, setCategories] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);

    // фільтри
    const [selectedCatId, setSelectedCatId] = useState("all");
    const [search, setSearch] = useState("");
    const [onlyAvailable] = useState(true);

    // кошик
    // [{ menuItemId, name, unitPrice, qty }]
    const [cart, setCart] = useState([]);
    const [note, setNote] = useState("");
    const [placing, setPlacing] = useState(false);
    const [isEditingOrder, setIsEditingOrder] = useState(false);

    // ------------- LOAD MENU -------------
    useEffect(() => {
        const loadMenu = async () => {
            try {
                setError("");
                setMenuLoaded(false);

                if (!tableId || tableId <= 0) {
                    setCategories([]);
                    setError("Немає tableId. Відкрий через /?table=5");
                    return;
                }

                const menuRes = await fetch(`${API_URL}/api/menu?tableId=${tableId}`);

                if (!menuRes.ok) throw new Error(await menuRes.text());

                const menuData = await menuRes.json();
                const normalized = normalizeCategories(menuData);

                setCategories(normalized);

                if (
                    selectedCatId !== "all" &&
                    !normalized.find((c) => String(c.id) === String(selectedCatId))
                ) {
                    setSelectedCatId("all");
                }
            } catch (e) {
                setError(getErrorText(e));
            } finally {
                setMenuLoaded(true);
            }
        };

        loadMenu();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId]);

    // ------------- LOAD ACTIVE ORDER -------------
    useEffect(() => {
        let isDisposed = false;

        if (isEditingOrder) {
            return undefined;
        }

        const loadOrder = async () => {
            try {
                if (!tableId || tableId <= 0) {
                    setActiveOrder(null);
                    setCart([]);
                    setNote("");
                    setIsEditingOrder(false);
                    return;
                }

                const orderRes = await fetch(`${API_URL}/api/menu/order?tableId=${tableId}`);

                if (!orderRes.ok && orderRes.status !== 204) throw new Error(await orderRes.text());

                if (isDisposed) return;

                if (orderRes.status === 204) {
                    setActiveOrder(null);
                    setCart([]);
                    setNote("");
                    setIsEditingOrder(false);
                    return;
                }

                const orderData = await orderRes.json();

                if (isDisposed) return;

                setActiveOrder(orderData);
                setCart(orderToCart(orderData));
                setNote(orderData?.note ?? "");
            } catch (e) {
                if (!isDisposed) {
                    setError(getErrorText(e));
                }
            }
        };

        loadOrder();
        const timer = setInterval(loadOrder, 2000);

        return () => {
            isDisposed = true;
            clearInterval(timer);
        };
    }, [tableId, isEditingOrder]);

    // ------------- FILTERED MENU -------------
    const filteredCategories = useMemo(() => {
        const s = search.trim().toLowerCase();

        return categories
            .filter((c) => selectedCatId === "all" || String(c.id) === String(selectedCatId))
            .map((c) => ({
                ...c,
                items: c.items
                    .filter((it) => {
                        if (onlyAvailable && !it.isAvailable) return false;
                        if (!s) return true;
                        return (
                            (it.name || "").toLowerCase().includes(s) ||
                            (it.description || "").toLowerCase().includes(s)
                        );
                    })
                    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
            }))
            .filter((c) => c.items.length > 0);
    }, [categories, selectedCatId, search, onlyAvailable]);

    // ------------- CART HELPERS -------------
    const cartTotal = useMemo(
        () => cart.reduce((sum, x) => sum + x.unitPrice * x.qty, 0),
        [cart]
    );

    const beginEditingOrder = () => {
        setIsEditingOrder(true);
    };

    const addToCart = (it) => {
        if (!it?.isAvailable) return;

        const id = it.id;
        const name = it.name ?? "Товар";
        const price = Number(it.price) || 0;

        beginEditingOrder();
        setCart((prev) => {
            const idx = prev.findIndex((x) => x.menuItemId === id);
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
                return copy;
            }
            return [...prev, { menuItemId: id, name, unitPrice: price, qty: 1 }];
        });
    };

    const inc = (id) => {
        beginEditingOrder();
        setCart((prev) =>
            prev.map((x) => (x.menuItemId === id ? { ...x, qty: x.qty + 1 } : x))
        );
    };

    const dec = (id) => {
        beginEditingOrder();
        setCart((prev) =>
            prev
                .map((x) => (x.menuItemId === id ? { ...x, qty: x.qty - 1 } : x))
                .filter((x) => x.qty > 0)
        );
    };

    const removeLine = (id) => {
        beginEditingOrder();
        setCart((prev) => prev.filter((x) => x.menuItemId !== id));
    };

    // ------------- CREATE / UPDATE ORDER -------------
    const placeOrder = async () => {
        if (!cart.length) return;

        setPlacing(true);
        setError("");

        try {
            const items = cart.map((x) => ({ menuItemId: x.menuItemId, qty: x.qty }));
            const hasActiveOrder = Number.isFinite(activeOrder?.id);
            const payload = hasActiveOrder
                ? {
                    note: note.trim() || null,
                    items,
                }
                : {
                    tableId,
                    note: note.trim() || null,
                    items,
                };

            const res = await fetch(
                hasActiveOrder
                    ? `${API_URL}/api/orders/${activeOrder.id}`
                    : `${API_URL}/api/orders`,
                {
                    method: hasActiveOrder ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error(await res.text());

            const savedOrder = await res.json();
            setActiveOrder(savedOrder);
            setCart(orderToCart(savedOrder));
            setNote(savedOrder?.note ?? "");
            setIsEditingOrder(false);

            alert(hasActiveOrder ? "Замовлення оновлено ✅" : "Замовлення відправлено ✅");
        } catch (e) {
            setError(getErrorText(e));
        } finally {
            setPlacing(false);
        }
    };

    // ------------- UI -------------
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
                            marginRight: 10,
                        }}
                    />
                    <div className="brandText">
                        <div className="brandName">Roland Larper</div>
                        <div className="brandSub">Меню • стіл №{tableId || "?"}</div>
                    </div>
                </div>

                <div className="topLinks">
                    <div className="topLink">Кошик: {cartTotal} грн</div>
                </div>
            </header>

            <main className="layout">
                <section className="menuCol">
                    {error && <div className="alert">Помилка: {error}</div>}

                    <div className="card" style={{ marginBottom: 14 }}>
                        <div className="cardTop" style={{ marginBottom: 10 }}>
                            <div className="cardTitle">Фільтри</div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <div>
                                <label className="label">Категорія</label>
                                <select
                                    className="input"
                                    value={selectedCatId}
                                    onChange={(e) => setSelectedCatId(e.target.value)}
                                >
                                    <option value="all">Усі</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Пошук</label>
                                <input
                                    className="input"
                                    placeholder="Напр., піца, кола..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {!menuLoaded && <div className="mutedSmall">Завантаження...</div>}

                    {menuLoaded && !error && filteredCategories.length === 0 && (
                        <div className="mutedSmall">Нічого не знайдено.</div>
                    )}

                    {menuLoaded && filteredCategories.map((cat) => (
                        <div key={cat.id} style={{ marginBottom: 18 }}>
                            <h2 className="sectionTitle">{cat.name}</h2>

                            <div className="grid">
                                {cat.items.map((it) => (
                                    <div key={it.id} className="card">
                                        {it.imageUrl && (
                                            <img
                                                className="cardImg"
                                                src={toAssetUrl(it.imageUrl)}
                                                alt={it.name}
                                                loading="lazy"
                                                onError={(e) => (e.currentTarget.style.display = "none")}
                                            />
                                        )}

                                        <div className="cardTop">
                                            <div className="cardTitle">{it.name}</div>
                                            <div className="price">{it.price} грн</div>
                                        </div>

                                        {it.description && <div className="mutedSmall">{it.description}</div>}

                                        <div className="cardBottom">
                                            <div className="pill">{it.isAvailable ? "В наявності" : "Немає"}</div>

                                            <button
                                                className="btn btnPrimary"
                                                onClick={() => addToCart(it)}
                                                disabled={!it.isAvailable}
                                            >
                                                Додати
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                <aside className="cartBox">
                    <div className="cartTitle">Кошик</div>
                    <div className="mutedSmall" style={{ marginBottom: 12 }}>
                        {activeOrder
                            ? `Замовлення #${activeOrder.id} • ${statusToText(activeOrder.status)}`
                            : "Нове замовлення"}
                    </div>

                    {cart.length === 0 ? (
                        <div className="mutedSmall">Порожньо</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {cart.map((x) => (
                                <div key={x.menuItemId} className="cartRow">
                                    <div style={{ flex: 1 }}>
                                        <div className="cartItemName">{x.name}</div>
                                        <div className="mutedSmall">{x.qty} × {x.unitPrice} грн</div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <button className="btn btnGhost" onClick={() => dec(x.menuItemId)}>-</button>
                                        <button className="btn btnGhost" onClick={() => inc(x.menuItemId)}>+</button>
                                        <button className="btn btnDanger" onClick={() => removeLine(x.menuItemId)}>✕</button>
                                    </div>

                                    <div className="price" style={{ minWidth: 90, textAlign: "right" }}>
                                        {x.unitPrice * x.qty} грн
                                    </div>
                                </div>
                            ))}

                            <div className="cartTotalRow">
                                <div className="mutedSmall">Разом</div>
                                <div className="price">{cartTotal} грн</div>
                            </div>

                            <div>
                                <div className="mutedSmall">Коментар до замовлення</div>
                                <input
                                    className="input"
                                    placeholder="Напр., без цибулі"
                                    value={note}
                                    onChange={(e) => {
                                        beginEditingOrder();
                                        setNote(e.target.value);
                                    }}
                                />
                            </div>

                            <button
                                className="btn btnWide btnPrimary"
                                onClick={placeOrder}
                                disabled={placing || cart.length === 0}
                            >
                                {placing
                                    ? (activeOrder ? "Оновляю..." : "Відправляю...")
                                    : (activeOrder ? "Оновити замовлення" : "Замовити")}
                            </button>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}
