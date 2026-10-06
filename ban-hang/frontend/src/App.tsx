import { BrowserRouter, Routes, Route } from "react-router-dom";

import BottomNav from "./components/BottomNav";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";

import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import ManageProducts from "./admin/ManageProducts";
import ManageUsers from "./admin/ManageUsers";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* Trang người dùng */}
                <Route path="/" element={<Home />} />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/products"
                    element={<Products />}
                />

                <Route
                    path="/products/:id"
                    element={<ProductDetail />}
                />

                <Route
                    path="/cart"
                    element={<Cart />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />

                {/* Trang quản trị */}
                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >
                    <Route
                        index
                        element={<Dashboard />}
                    />

                    <Route
                        path="products"
                        element={<ManageProducts />}
                    />

                    <Route
                        path="users"
                        element={<ManageUsers />}
                    />
                </Route>

            </Routes>

            {/* Menu dưới */}
            <BottomNav />

        </BrowserRouter>
    );
}

export default App;