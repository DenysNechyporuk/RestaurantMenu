import { useEffect, useState } from "react";

const API_URL = "http://localhost:5046";

function App() {
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/menu?tableId=5`)
            .then(res => res.json())
            .then(data => setCategories(data));
    }, []);

    const addToCart = (item) => {
        const existing = cart.find(x => x.menuItemId === item.id);
        if (existing) {
            setCart(cart.map(x =>
                x.menuItemId === item.id
                    ? { ...x, qty: x.qty + 1 }
                    : x
            ));
        } else {
            setCart([...cart, {
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                qty: 1
            }]);
        }
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;

        const body = {
            tableId: 5,
            note: "",
            items: cart.map(x => ({
                menuItemId: x.menuItemId,
                qty: x.qty
            }))
        };

        const res = await fetch(`${API_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("Замовлення відправлено!");
            setCart([]);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Меню</h1>

            {categories.map(cat => (
                <div key={cat.id}>
                    <h2>{cat.name}</h2>
                    {cat.items.map(item => (
                        <div key={item.id} style={{ marginBottom: 10 }}>
                            <strong>{item.name}</strong> — {item.price} грн
                            <button
                                style={{ marginLeft: 10 }}
                                onClick={() => addToCart(item)}
                            >
                                Додати
                            </button>
                        </div>
                    ))}
                </div>
            ))}

            <hr />
            <h2>Кошик</h2>

            {cart.map(item => (
                <div key={item.menuItemId}>
                    {item.name} x{item.qty}
                </div>
            ))}

            <button
                style={{ marginTop: 10 }}
                onClick={placeOrder}
            >
                Замовити
            </button>
        </div>
    );
}

export default App;