import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatPrice, getToken, type Product } from "../api";

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api<Product>(`/products/${id}`).then(setProduct).catch((requestError: unknown) => {
            setError(requestError instanceof Error ? requestError.message : "Không tải được sản phẩm");
        }).finally(() => setLoading(false));
    }, [id]);

    async function addToCart() {
        if (!getToken()) {
            navigate("/login");
            return;
        }
        if (!product) return;
        setError("");
        setMessage("");
        try {
            const result = await api<{ message: string }>("/cart", {
                method: "POST",
                body: JSON.stringify({ product_id: product.id, quantity }),
            });
            setMessage(result.message);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể thêm vào giỏ");
        }
    }

    if (loading) return <div className="page"><p>Đang tải sản phẩm...</p></div>;
    if (!product) return <div className="page"><p className="form-message error-message">{error || "Không tìm thấy sản phẩm"}</p><Link to="/products">Quay lại danh sách</Link></div>;

    return (
        <div className="page">
            <h1 className="page-title">Chi tiết sản phẩm</h1>
            <div className="cart-box product-detail">
                {product.image ? <img src={product.image} alt={product.name} /> : <div className="detail-placeholder">🛍️</div>}
                <div className="product-detail-info">
                    <h2>{product.name}</h2>
                    <p className="detail-price">{formatPrice(product.price)}</p>
                    <p>{product.description || "Sản phẩm chất lượng từ Oanh Shop."}</p>
                    <p>Danh mục: {product.category_name || "Chưa phân loại"}</p>
                    <p>Còn hàng: {product.quantity}</p>
                    {product.quantity > 0 ? (
                        <div className="detail-actions">
                            <label htmlFor="product-quantity">Số lượng</label>
                            <input id="product-quantity" className="form-input quantity-input" type="number" min={1}
                                max={product.quantity} value={quantity}
                                onChange={(event) => setQuantity(Math.max(1, Math.min(product.quantity, Number(event.target.value) || 1)))} />
                            <button className="form-button" type="button" onClick={addToCart}>🛒 Thêm vào giỏ hàng</button>
                        </div>
                    ) : <p className="error-message">Sản phẩm hiện đã hết hàng.</p>}
                    {message && <p className="form-message success-message" role="status">{message}</p>}
                    {error && <p className="form-message error-message" role="alert">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
