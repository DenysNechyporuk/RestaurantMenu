import { useEffect, useRef, useState } from "react";
import "../app.css";

const API_URL = "http://localhost:5046";
const STATUS_OPTIONS = [
    { value: "New", label: "Нові" },
    { value: "InProgress", label: "Готується" },
    { value: "Done", label: "Готово" },
    { value: "Cancelled", label: "Відмінено" },
];

function statusToText(status) {
    if (status === 0) return "Новий";
    if (status === 1) return "Готується";
    if (status === 2) return "Готово";
    if (status === 3) return "Відмінено";
    return String(status);
}

function itemStatusToText(status) {
    if (status === 0 || status === "New") return "Новий";
    if (status === 1 || status === "Confirm") return "Підтверджено";
    if (status === 2 || status === "Decline") return "Відхилено";
    return String(status);
}

function getErrorText(error) {
    return error instanceof Error ? error.message : String(error);
}

function createEmptyEditItem(menuItems) {
    return {
        menuItemId: String(menuItems[0]?.id ?? ""),
        qty: 1,
    };
}

export default function AdminOrdersPage() {
    const [statuses, setStatuses] = useState(["New"]);
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [editForm, setEditForm] = useState({ note: "", items: [] });
    const [savingOrder, setSavingOrder] = useState(false);
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

            const nowIds = new Set(data.map((item) => item.id));
            let hasNew = false;
            for (const id of nowIds) {
                if (!lastIds.current.has(id)) hasNew = true;
            }
            lastIds.current = nowIds;

            if (hasNew && statuses.includes("New")) {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = ctx.createOscillator();
                    const gain = ctx.createGain();
                    oscillator.connect(gain);
                    gain.connect(ctx.destination);
                    oscillator.frequency.value = 880;
                    gain.gain.value = 0.05;
                    oscillator.start();
                    setTimeout(() => {
                        oscillator.stop();
                        ctx.close();
                    }, 120);
                } catch {}
            }
        } catch (e) {
            setError(getErrorText(e));
        }
    };

    const loadMenuItems = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/menu/items`);
            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            setMenuItems(data);
        } catch (e) {
            setError(getErrorText(e));
        }
    };

    useEffect(() => {
        fetchOrders();
        const timer = setInterval(fetchOrders, 2000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statuses]);

    useEffect(() => {
        loadMenuItems();
    }, []);

    const updateStatus = async (id, newStatusNumber) => {
        try {
            setError("");
            const res = await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatusNumber }),
            });

            if (!res.ok) throw new Error(await res.text());
            await fetchOrders();
        } catch (e) {
            setError(getErrorText(e));
        }
    };

    const startEditOrder = (order) => {
        setError("");
        setEditingOrderId(order.id);
        setEditForm({
            note: order.note ?? "",
            items: order.items.length > 0
                ? order.items.map((item) => ({
                    menuItemId: String(item.menuItemId),
                    qty: item.qty,
                }))
                : [createEmptyEditItem(menuItems)],
        });
    };

    const cancelEditOrder = () => {
        setEditingOrderId(null);
        setEditForm({ note: "", items: [] });
        setSavingOrder(false);
    };

    const updateEditItem = (index, patch) => {
        setEditForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
            ),
        }));
    };

    const addEditItem = () => {
        setEditForm((current) => ({
            ...current,
            items: [...current.items, createEmptyEditItem(menuItems)],
        }));
    };

    const removeEditItem = (index) => {
        setEditForm((current) => ({
            ...current,
            items: current.items.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const saveOrder = async (orderId) => {
        const payloadItems = editForm.items.map((item) => ({
            menuItemId: Number(item.menuItemId),
            qty: Number(item.qty),
        }));

        if (payloadItems.length === 0) {
            setError("Замовлення повинно містити хоча б одну позицію");
            return;
        }

        if (payloadItems.some((item) => !Number.isFinite(item.menuItemId) || item.menuItemId <= 0)) {
            setError("Оберіть товар для кожної позиції");
            return;
        }

        if (payloadItems.some((item) => !Number.isFinite(item.qty) || item.qty <= 0)) {
            setError("Кількість повинна бути більшою за 0");
            return;
        }

        try {
            setSavingOrder(true);
            setError("");

            const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    note: editForm.note.trim() || null,
                    items: payloadItems,
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            const updatedOrder = await res.json();
            setOrders((current) =>
                current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
            );
            cancelEditOrder();
        } catch (e) {
            setError(getErrorText(e));
        } finally {
            setSavingOrder(false);
        }
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
                            marginRight: 10,
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

                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
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
                        {orders.map((order) => {
                            const isEditing = editingOrderId === order.id;

                            return (
                                <div key={order.id} className="card">
                                    <div className="cardTop">
                                        <div className="cardTitle">Замовлення #{order.id} • Стіл {order.tableId}</div>
                                        <div className="pill">{statusToText(order.status)}</div>
                                    </div>

                                    <div className="mutedSmall" style={{ marginTop: 6 }}>
                                        {new Date(order.createdAtUtc).toLocaleString()}
                                    </div>

                                    {!isEditing && order.note && (
                                        <div style={{ marginTop: 8 }} className="mutedSmall">
                                            Коментар: {order.note}
                                        </div>
                                    )}

                                    {!isEditing ? (
                                        <>
                                            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                                {order.items.map((item, index) => (
                                                    <div key={`${item.menuItemId}-${index}`} className="cartRow" style={{ margin: 0 }}>
                                                        <div>
                                                            <div className="cartItemName">{item.name}</div>
                                                            <div className="mutedSmall">
                                                                Статус: {itemStatusToText(item.status)}
                                                            </div>
                                                            <div className="mutedSmall">
                                                                {item.unitPrice} × {item.qty} = {item.lineTotal} грн
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="cartTotalRow">
                                                <div className="mutedSmall">Разом</div>
                                                <div className="total">{order.total} грн</div>
                                            </div>

                                            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                                                <button className="btn btnGhost" onClick={() => startEditOrder(order)}>
                                                    Редагувати
                                                </button>
                                                <button className="btn btnGhost" onClick={() => updateStatus(order.id, 1)}>
                                                    В роботу
                                                </button>
                                                <button className="btn btnPrimary" onClick={() => updateStatus(order.id, 2)}>
                                                    Готово
                                                </button>
                                                <button className="btn btnDanger" onClick={() => updateStatus(order.id, 3)}>
                                                    Скасувати
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div>
                                                <label className="label">Коментар</label>
                                                <textarea
                                                    className="input"
                                                    rows={3}
                                                    value={editForm.note}
                                                    onChange={(e) =>
                                                        setEditForm((current) => ({ ...current, note: e.target.value }))
                                                    }
                                                />
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                {editForm.items.map((item, index) => {
                                                    const selectedItem = menuItems.find((menuItem) => menuItem.id === Number(item.menuItemId));

                                                    return (
                                                        <div
                                                            key={`${order.id}-edit-${index}`}
                                                            className="cartRow"
                                                            style={{
                                                                margin: 0,
                                                                alignItems: "flex-end",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <div style={{ flex: "1 1 260px" }}>
                                                                <label className="label" style={{ marginTop: 0 }}>
                                                                    Товар
                                                                </label>
                                                                <select
                                                                    className="input"
                                                                    value={item.menuItemId}
                                                                    onChange={(e) =>
                                                                        updateEditItem(index, { menuItemId: e.target.value })
                                                                    }
                                                                >
                                                                    {!selectedItem && item.menuItemId && (
                                                                        <option value={item.menuItemId}>
                                                                            Невідомий товар #{item.menuItemId}
                                                                        </option>
                                                                    )}
                                                                    {menuItems.map((menuItem) => (
                                                                        <option key={menuItem.id} value={menuItem.id}>
                                                                            {menuItem.name} • {menuItem.price} грн{menuItem.isAvailable ? "" : " • недоступний"}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div style={{ width: 110 }}>
                                                                <label className="label" style={{ marginTop: 0 }}>
                                                                    К-сть
                                                                </label>
                                                                <input
                                                                    className="input"
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    value={item.qty}
                                                                    onChange={(e) =>
                                                                        updateEditItem(index, { qty: e.target.value })
                                                                    }
                                                                />
                                                            </div>

                                                            <button
                                                                className="btn btnDanger"
                                                                onClick={() => removeEditItem(index)}
                                                                disabled={editForm.items.length === 1}
                                                            >
                                                                Видалити
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="cartTotalRow">
                                                <div className="mutedSmall">Позицій у редакторі</div>
                                                <div className="total">{editForm.items.length}</div>
                                            </div>

                                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                                <button
                                                    className="btn btnGhost"
                                                    onClick={addEditItem}
                                                    disabled={menuItems.length === 0}
                                                >
                                                    + Додати товар
                                                </button>
                                                <button
                                                    className="btn btnPrimary"
                                                    onClick={() => saveOrder(order.id)}
                                                    disabled={savingOrder}
                                                >
                                                    {savingOrder ? "Збереження..." : "Зберегти"}
                                                </button>
                                                <button className="btn btnGhost" onClick={cancelEditOrder} disabled={savingOrder}>
                                                    Скасувати зміни
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
