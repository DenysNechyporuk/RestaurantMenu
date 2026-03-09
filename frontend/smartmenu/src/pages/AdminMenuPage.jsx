import { useEffect, useMemo, useState } from "react";
import "../app.css";

const API_URL = "http://localhost:5046";

export default function AdminMenuPage() {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");
    const [savingItem, setSavingItem] = useState(false);
    const [savingCat, setSavingCat] = useState(false);

    const [catForm, setCatForm] = useState({ id: null, name: "", sortOrder: 0 });

    const [itemForm, setItemForm] = useState({
        id: null,
        categoryId: 1,
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        isAvailable: true,
    });

    const loadAll = async () => {
        try {
            setError("");
            const [cRes, iRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/menu/categories`),
                fetch(`${API_URL}/api/admin/menu/items`),
            ]);

            if (!cRes.ok) throw new Error(await cRes.text());
            if (!iRes.ok) throw new Error(await iRes.text());

            const c = await cRes.json();
            const i = await iRes.json();

            setCategories(c);
            setItems(i);

            // поправити categoryId у формі, якщо категорії змінились
            if (c.length && !c.find((x) => x.id === Number(itemForm.categoryId))) {
                setItemForm((f) => ({ ...f, categoryId: c[0].id }));
            }
        } catch (e) {
            setError(String(e));
        }
    };

    useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

    const filteredItems = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter(
            (x) =>
                (x.name || "").toLowerCase().includes(s) ||
                (x.description || "").toLowerCase().includes(s)
        );
    }, [items, q]);

    const catNameById = (id) => categories.find((c) => c.id === id)?.name ?? `#${id}`;

    // ---------- categories ----------
    const startCreateCategory = () => setCatForm({ id: null, name: "", sortOrder: 0 });

    const startEditCategory = (c) =>
        setCatForm({ id: c.id, name: c.name ?? "", sortOrder: c.sortOrder ?? 0 });

    const saveCategory = async () => {
        const name = (catForm.name || "").trim();
        if (!name) return setError("Назва категорії обовʼязкова");

        setSavingCat(true);
        setError("");

        const payload = { name, sortOrder: Number(catForm.sortOrder) };

        try {
            if (catForm.id == null) {
                const res = await fetch(`${API_URL}/api/admin/menu/categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                const res = await fetch(`${API_URL}/api/admin/menu/categories/${catForm.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(await res.text());
            }

            await loadAll();
            startCreateCategory();
        } catch (e) {
            setError(String(e));
        } finally {
            setSavingCat(false);
        }
    };

    const deleteCategory = async (id) => {
        if (!confirm("Видалити категорію? (якщо є товари — не дасть видалити)")) return;

        try {
            setError("");
            const res = await fetch(`${API_URL}/api/admin/menu/categories/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            await loadAll();
            if (catForm.id === id) startCreateCategory();
        } catch (e) {
            setError(String(e));
        }
    };

    // ---------- items ----------
    const startCreateItem = () =>
        setItemForm({
            id: null,
            categoryId: categories[0]?.id ?? 1,
            name: "",
            description: "",
            price: 0,
            imageUrl: "",
            isAvailable: true,
        });

    const startEditItem = (it) =>
        setItemForm({
            id: it.id,
            categoryId: it.categoryId,
            name: it.name ?? "",
            description: it.description ?? "",
            price: it.price ?? 0,
            imageUrl: it.imageUrl ?? "",
            isAvailable: !!it.isAvailable,
        });

    const saveItem = async () => {
        const name = (itemForm.name || "").trim();
        if (!name) return setError("Назва товару обовʼязкова");

        setSavingItem(true);
        setError("");

        const payload = {
            categoryId: Number(itemForm.categoryId),
            name,
            description: itemForm.description?.trim() || null,
            price: Number(itemForm.price),
            imageUrl: itemForm.imageUrl?.trim() || null,
            isAvailable: !!itemForm.isAvailable,
        };

        try {
            if (itemForm.id == null) {
                const res = await fetch(`${API_URL}/api/admin/menu/items`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                const res = await fetch(`${API_URL}/api/admin/menu/items/${itemForm.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(await res.text());
            }

            await loadAll();
            startCreateItem();
        } catch (e) {
            setError(String(e));
        } finally {
            setSavingItem(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm("Видалити товар?")) return;
        try {
            setError("");
            const res = await fetch(`${API_URL}/api/admin/menu/items/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            await loadAll();
            if (itemForm.id === id) startCreateItem();
        } catch (e) {
            setError(String(e));
        }
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
                        <div className="brandSub">Адмін • Категорії та Товари</div>
                    </div>
                </div>

                <div className="topLinks">
                    <a className="topLink" href="/admin">Замовлення</a>
                    <a className="topLink" href="/admin/qr">QR</a>
                    <a className="topLink" href="/">Меню</a>
                </div>
            </header>

            <main style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
                {error && <div className="alert">Помилка: {error}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* LEFT: categories + items list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Categories list */}
                        <div className="card">
                            <div className="cardTop" style={{ marginBottom: 10 }}>
                                <div className="cardTitle">Категорії</div>
                                <button className="btn btnPrimary" onClick={startCreateCategory}>+ Нова</button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflow: "auto" }}>
                                {categories.map((c) => (
                                    <div key={c.id} className="cartRow" style={{ cursor: "pointer" }}>
                                        <div style={{ flex: 1 }} onClick={() => startEditCategory(c)}>
                                            <div className="cartItemName">{c.name}</div>
                                            <div className="mutedSmall">SortOrder: {c.sortOrder}</div>
                                        </div>
                                        <button className="btn btnDanger" onClick={() => deleteCategory(c.id)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Items list */}
                        <div className="card">
                            <div className="cardTop" style={{ marginBottom: 10 }}>
                                <div className="cardTitle">Товари</div>
                                <button className="btn btnPrimary" onClick={startCreateItem}>+ Новий</button>
                            </div>

                            <input className="input" placeholder="Пошук…" value={q} onChange={(e) => setQ(e.target.value)} />

                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflow: "auto" }}>
                                {filteredItems.map((it) => (
                                    <div key={it.id} className="cartRow" style={{ cursor: "pointer" }}>
                                        <div style={{ flex: 1 }} onClick={() => startEditItem(it)}>
                                            <div className="cartItemName">
                                                {it.name} <span className="mutedSmall">({it.price} грн)</span>
                                            </div>
                                            <div className="mutedSmall">
                                                {catNameById(it.categoryId)} • {it.isAvailable ? "в наявності" : "приховано"}
                                            </div>
                                        </div>
                                        <button className="btn btnDanger" onClick={() => deleteItem(it.id)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: forms */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Category form */}
                        <div className="cartBox" style={{ position: "static" }}>
                            <div className="cartTitle">
                                {catForm.id ? `Категорія #${catForm.id}` : "Нова категорія"}
                            </div>

                            <label className="label">Назва</label>
                            <input className="input" value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} />

                            <label className="label">SortOrder (порядок)</label>
                            <input className="input" type="number" value={catForm.sortOrder} onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))} />

                            <button className="btn btnWide btnPrimary" onClick={saveCategory} disabled={savingCat}>
                                {savingCat ? "Зберігаю…" : "Зберегти категорію"}
                            </button>

                            {catForm.id != null && (
                                <button className="btn btnWide btnGhost" onClick={startCreateCategory}>
                                    Скасувати
                                </button>
                            )}
                        </div>

                        {/* Item form */}
                        <div className="cartBox" style={{ position: "static" }}>
                            <div className="cartTitle">
                                {itemForm.id ? `Товар #${itemForm.id}` : "Новий товар"}
                            </div>

                            <label className="label">Категорія</label>
                            <select className="input" value={itemForm.categoryId} onChange={(e) => setItemForm((f) => ({ ...f, categoryId: e.target.value }))}>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <label className="label">Назва</label>
                            <input className="input" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />

                            <label className="label">Опис</label>
                            <input className="input" value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} />

                            <label className="label">Ціна (грн)</label>
                            <input className="input" type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))} />

                            <label className="label">Image URL (/images/xxx.jpg)</label>
                            <input className="input" value={itemForm.imageUrl} onChange={(e) => setItemForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="/images/pizza.jpg" />

                            {itemForm.imageUrl && (
                                <div style={{ marginTop: 10 }}>
                                    <div className="mutedSmall">Превʼю:</div>
                                    <img
                                        src={itemForm.imageUrl}
                                        alt="preview"
                                        style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginTop: 6, border: "1px solid rgba(255,255,255,.08)" }}
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                </div>
                            )}

                            <label className="label" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input type="checkbox" checked={itemForm.isAvailable} onChange={(e) => setItemForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
                                В наявності
                            </label>

                            <button className="btn btnWide btnPrimary" onClick={saveItem} disabled={savingItem}>
                                {savingItem ? "Зберігаю…" : "Зберегти товар"}
                            </button>

                            {itemForm.id != null && (
                                <button className="btn btnWide btnGhost" onClick={startCreateItem}>
                                    Скасувати
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}