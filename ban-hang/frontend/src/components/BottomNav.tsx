import { NavLink, useLocation } from "react-router-dom";

function BottomNav() {
    const location = useLocation();
    if (location.pathname.startsWith("/admin")) return null;

    return (
        <nav className="bottom-nav">

            <NavLink
                to="/"
                className={({ isActive }) =>
                    isActive ? "bottom-item active" : "bottom-item"
                }
            >
                <span>🏠</span>
                <small>Trang chủ</small>
            </NavLink>

            <NavLink
                to="/products"
                className={({ isActive }) =>
                    isActive ? "bottom-item active" : "bottom-item"
                }
            >
                <span>🛍️</span>
                <small>Sản phẩm</small>
            </NavLink>

            <NavLink
                to="/cart"
                className={({ isActive }) =>
                    isActive ? "bottom-item active" : "bottom-item"
                }
            >
                <span>🛒</span>
                <small>Giỏ hàng</small>
            </NavLink>

            <NavLink
                to="/profile"
                className={({ isActive }) =>
                    isActive ? "bottom-item active" : "bottom-item"
                }
            >
                <span>👤</span>
                <small>Cá nhân</small>
            </NavLink>

        </nav>
    );
}

export default BottomNav;