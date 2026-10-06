import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { api, getStoredUser, type User } from "../api";

function AdminLayout() {
    const [user, setUser] = useState<User | null>(getStoredUser());
    const [authorized, setAuthorized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api<{ user: User }>("/auth/me").then(({ user: currentUser }) => {
            if (currentUser.role !== "admin") {
                navigate("/profile", { replace: true });
                return;
            }
            setUser(currentUser);
            setAuthorized(true);
        }).catch(() => navigate("/login", { replace: true }));
    }, [navigate]);

    if (!authorized) {
        return <div className="page"><p>Đang xác thực quyền quản trị...</p></div>;
    }

    return (
        <div className="admin-layout">

            <aside className="admin-sidebar">

                <div className="admin-logo">
                    🛍️ Oanh Shop
                </div>

                <p className="admin-title">
                    QUẢN TRỊ
                </p>

                <nav className="admin-menu">

                    <Link to="/admin">
                        📊 Tổng quan
                    </Link>

                    <Link to="/admin/products">
                        📦 Sản phẩm
                    </Link>

                    <Link to="/admin/users">
                        👥 Người dùng
                    </Link>

                    <Link to="/">
                        🏠 Về trang bán hàng
                    </Link>

                </nav>

            </aside>


            <main className="admin-content">

                <header className="admin-header">

                    <div>
                        <h2>Quản trị hệ thống</h2>
                        <p>Quản lý Oanh Shop</p>
                    </div>

                    <Link className="admin-account" to="/profile">{user?.name || "Admin"} · Cá nhân</Link>

                </header>


                <div className="admin-page">
                    <Outlet />
                </div>

            </main>

        </div>
    );
}

export default AdminLayout;