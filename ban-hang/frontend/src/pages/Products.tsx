import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatPrice, type Category, type Product } from "../api";

function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();

    useEffect(() => {
        setCategoryId(searchParams.get("category") || "");
        setSearch(searchParams.get("search") || "");
        Promise.all([
            api<Product[]>("/products"),
            api<Category[]>("/products/categories"),
        ]).then(([productData, categoryData]) => {
            setProducts(productData);
            setCategories(categoryData);
        }).catch((requestError: unknown) => {
            setError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu");
        }).finally(() => setLoading(false));
    }, [searchParams]);

    const visibleProducts = products.filter((product) => {
        const matchesCategory = !categoryId || String(product.category_id) === categoryId;
        const query = search.trim().toLocaleLowerCase("vi");
        const matchesSearch = !query || `${product.name} ${product.category_name || ""}`.toLocaleLowerCase("vi").includes(query);
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="page">
            <h1 className="page-title">Sản phẩm</h1>
            <p className="page-description">Khám phá các sản phẩm tại Oanh Shop.</p>
            <div className="catalog-controls">
                <input className="form-input" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm..."
                    value={search} onChange={(event) => setSearch(event.target.value)} />
                <select className="form-input" aria-label="Lọc theo danh mục" value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}>
                    <option value="">Tất cả danh mục</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
            </div>
            {loading && <p>Đang tải sản phẩm...</p>}
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {!loading && !error && visibleProducts.length === 0 && <p>Không tìm thấy sản phẩm phù hợp.</p>}
            <div className="product-list">
                {visibleProducts.map((product) => (
                    <Link key={product.id} className="product-card" to={`/products/${product.id}`}>
                        {product.image ? <img src={product.image} alt={product.name} className="product-image" /> :
                            <div className="product-image product-image-placeholder">🛍️</div>}
                        <h3>{product.name}</h3>
                        <p>{formatPrice(product.price)}</p>
                        <small>Danh mục: {product.category_name || "Chưa phân loại"}</small>
                        <small>Còn lại: {product.quantity}</small>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Products;
