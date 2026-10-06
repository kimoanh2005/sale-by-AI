import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice, getStoredUser, type Category, type Product } from "../api";

function Home() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState("");
    const user = getStoredUser();

    useEffect(() => {
        Promise.all([api<Category[]>("/products/categories"), api<Product[]>("/products")])
            .then(([categoryData, productData]) => {
                setCategories(categoryData);
                setProducts(productData.slice(0, 4));
            })
            .catch((requestError: unknown) => {
                setError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu cửa hàng");
            });
    }, []);

    return (
        <div className="mobile-page">
            <div className="mobile-header">
                <div><small>Xin chào 👋</small><h2>{user?.name || "Oanh Shop"}</h2></div>
                <Link className="header-avatar" to="/profile" aria-label="Trang cá nhân">👤</Link>
            </div>
            <form className="search-box" action="/products">
                🔍<input name="search" type="search" placeholder="Tìm kiếm sản phẩm..." />
            </form>
            <section className="mobile-banner">
                <div><small>✨ Chào mừng đến Oanh Shop</small>
                    <h1>Mua sắm<br />dễ dàng hơn</h1>
                    <Link to="/products" className="banner-button">Mua ngay</Link>
                </div>
                <div className="banner-icon">🛍️</div>
            </section>
            <section className="mobile-section">
                <div className="section-header"><h3>Danh mục</h3><Link to="/products">Xem tất cả</Link></div>
                {categories.length === 0 && !error && <p className="muted-text">Chưa có danh mục.</p>}
                <div className="category-list">
                    {categories.map((category, index) => (
                        <Link className="category-item" to={`/products?category=${category.id}`} key={category.id}>
                            <div>{["👗", "🎧", "👜", "🎁"][index % 4]}</div><span>{category.name}</span>
                        </Link>
                    ))}
                </div>
            </section>
            <section className="mobile-section">
                <div className="section-header"><h3>Sản phẩm nổi bật</h3><Link to="/products">Xem tất cả</Link></div>
                {error && <p className="form-message error-message" role="alert">{error}</p>}
                <div className="mobile-products">
                    {products.map((product) => <Link className="mobile-product-card" to={`/products/${product.id}`} key={product.id}>
                        {product.image ? <img className="mobile-product-image" src={product.image} alt={product.name} /> :
                            <div className="mobile-product-image">🛍️</div>}
                        <h4>{product.name}</h4><p>{formatPrice(product.price)}</p>
                    </Link>)}
                    {!products.length && !error && <p className="muted-text">Chưa có sản phẩm.</p>}
                </div>
            </section>
        </div>
    );
}

export default Home;
