import { useEffect, useState } from "react";
import { api, type Category, type Product, type User } from "../api";

function Dashboard() {
    const [productCount, setProductCount] = useState<number | null>(null);
    const [userCount, setUserCount] = useState<number | null>(null);
    const [categoryCount, setCategoryCount] = useState<number | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([
            api<Product[]>("/products"),
            api<User[]>("/users"),
            api<Category[]>("/products/categories"),
        ]).then(([products, users, categories]) => {
            setProductCount(products.length);
            setUserCount(users.length);
            setCategoryCount(categories.length);
        }).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu"));
    }, []);

    return (
        <div>
            <h1 className="admin-page-title">Tổng quan</h1>
            <p className="admin-description">Số liệu được lấy trực tiếp từ cơ sở dữ liệu.</p>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            <div className="dashboard-grid">
                <div className="dashboard-card"><div className="dashboard-icon">📦</div><div><p>Tổng sản phẩm</p><h2>{productCount ?? "..."}</h2></div></div>
                <div className="dashboard-card"><div className="dashboard-icon">👥</div><div><p>Người dùng</p><h2>{userCount ?? "..."}</h2></div></div>
                <div className="dashboard-card"><div className="dashboard-icon">🏷️</div><div><p>Danh mục</p><h2>{categoryCount ?? "..."}</h2></div></div>
            </div>
            <div className="admin-welcome">
                <h2>👋 Xin chào Admin!</h2>
                <p>Bạn có thể quản lý sản phẩm, phân loại danh mục và tài khoản người dùng từ menu bên trái.</p>
            </div>
        </div>
    );
}

export default Dashboard;
