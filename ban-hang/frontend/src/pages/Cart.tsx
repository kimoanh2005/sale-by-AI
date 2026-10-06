import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatPrice, getToken } from "../api";

interface CartItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    image: string | null;
    quantity: number;
    stock: number;
}

function Cart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadCart = useCallback(async () => {
        try {
            const data = await api<CartItem[]>("/cart");
            setItems(data);
            setError("");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không tải được giỏ hàng");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!getToken()) {
            setLoading(false);
            return;
        }
        void loadCart();
    }, [loadCart]);

    async function updateQuantity(item: CartItem, quantity: number) {
        try {
            await api(`/cart/${item.id}`, { method: "PUT", body: JSON.stringify({ quantity }) });
            await loadCart();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Cập nhật giỏ hàng thất bại");
        }
    }

    async function removeItem(itemId: number) {
        try {
            await api(`/cart/${itemId}`, { method: "DELETE" });
            await loadCart();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể xóa sản phẩm");
        }
    }

    if (!getToken()) {
        return <div className="page"><h1 className="page-title">Giỏ hàng</h1><div className="cart-box cart-empty">
            <p>Đăng nhập để xem và lưu giỏ hàng của bạn.</p>
            <button className="form-button cart-login-button" onClick={() => navigate("/login")}>Đăng nhập</button>
        </div></div>;
    }

    const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    return (
        <div className="page">
            <h1 className="page-title">Giỏ hàng</h1>
            {loading && <p>Đang tải giỏ hàng...</p>}
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {!loading && items.length === 0 && <div className="cart-box cart-empty">
                <p>🛒 Giỏ hàng của bạn đang trống.</p><Link to="/products">Tiếp tục mua sắm</Link>
            </div>}
            {items.length > 0 && <>
                <div className="cart-box cart-items">
                    {items.map((item) => (
                        <div className="cart-row" key={item.id}>
                            {item.image ? <img src={item.image} alt={item.name} /> : <div className="cart-image-placeholder">🛍️</div>}
                            <div className="cart-item-info">
                                <Link to={`/products/${item.product_id}`}><strong>{item.name}</strong></Link>
                                <span>{formatPrice(item.price)}</span>
                            </div>
                            <div className="cart-quantity">
                                <button aria-label={`Giảm ${item.name}`} disabled={item.quantity <= 1}
                                    onClick={() => void updateQuantity(item, item.quantity - 1)}>−</button>
                                <span>{item.quantity}</span>
                                <button aria-label={`Tăng ${item.name}`} disabled={item.quantity >= item.stock}
                                    onClick={() => void updateQuantity(item, item.quantity + 1)}>+</button>
                            </div>
                            <button className="delete-button" onClick={() => void removeItem(item.id)}>Xóa</button>
                        </div>
                    ))}
                </div>
                <div className="cart-total"><strong>Tổng cộng</strong><strong>{formatPrice(total)}</strong></div>
            </>}
        </div>
    );
}

export default Cart;
