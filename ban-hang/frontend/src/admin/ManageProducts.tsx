import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, formatPrice, type Category, type Product } from "../api";

const emptyForm = { name: "", price: "", image: "", description: "", quantity: "0", category_id: "" };

function ManageProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        const [productData, categoryData] = await Promise.all([
            api<Product[]>("/products"),
            api<Category[]>("/products/categories"),
        ]);
        setProducts(productData);
        setCategories(categoryData);
    }, []);

    useEffect(() => {
        loadData().catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu"));
    }, [loadData]);

    function startEdit(product: Product) {
        setEditingId(product.id);
        setForm({
            name: product.name,
            price: String(product.price),
            image: product.image || "",
            description: product.description || "",
            quantity: String(product.quantity),
            category_id: product.category_id ? String(product.category_id) : "",
        });
        setError("");
        setMessage("");
    }

    function resetForm() {
        setEditingId(null);
        setForm(emptyForm);
    }

    async function saveProduct(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setMessage("");
        const payload = {
            ...form,
            price: Number(form.price),
            quantity: Number(form.quantity),
            category_id: form.category_id ? Number(form.category_id) : null,
        };
        try {
            const result = await api<{ message: string }>(editingId ? `/products/${editingId}` : "/products", {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });
            await loadData();
            setMessage(result.message);
            resetForm();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể lưu sản phẩm");
        }
    }

    async function deleteProduct(product: Product) {
        if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
        setError("");
        try {
            await api(`/products/${product.id}`, { method: "DELETE" });
            await loadData();
            if (editingId === product.id) resetForm();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể xóa sản phẩm");
        }
    }

    return (
        <div>
            <div className="admin-title-row">
                <div><h1 className="admin-page-title">Quản lý sản phẩm</h1><p className="admin-description">Thêm, sửa và xóa sản phẩm.</p></div>
                <button className="admin-primary-button" onClick={() => { resetForm(); setError(""); }}>+ Thêm sản phẩm</button>
            </div>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {message && <p className="form-message success-message" role="status">{message}</p>}
            <form className="admin-form" onSubmit={saveProduct}>
                <h2>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h2>
                <div className="admin-form-grid">
                    <label>Tên sản phẩm<input className="form-input" value={form.name} required
                        onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                    <label>Giá (VNĐ)<input className="form-input" type="number" min="0" step="1" value={form.price} required
                        onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
                    <label>Số lượng<input className="form-input" type="number" min="0" step="1" value={form.quantity} required
                        onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
                    <label>Danh mục<select className="form-input" value={form.category_id}
                        onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
                        <option value="">Chưa phân loại</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select></label>
                    <label className="admin-form-wide">URL hình ảnh<input className="form-input" type="url" value={form.image}
                        onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>
                    <label className="admin-form-wide">Mô tả<textarea className="form-input" rows={3} value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                </div>
                <button className="admin-primary-button" type="submit">{editingId ? "Lưu thay đổi" : "Thêm sản phẩm"}</button>
                {editingId && <button className="secondary-button inline-button" type="button" onClick={resetForm}>Hủy sửa</button>}
            </form>
            <div className="admin-table-box">
                <table className="admin-table">
                    <thead><tr><th>ID</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Số lượng</th><th>Thao tác</th></tr></thead>
                    <tbody>{products.map((product) => <tr key={product.id}>
                        <td>{product.id}</td><td><strong>{product.name}</strong></td><td>{product.category_name || "—"}</td>
                        <td className="price">{formatPrice(product.price)}</td><td>{product.quantity}</td>
                        <td><button className="edit-button" onClick={() => startEdit(product)}>Sửa</button>
                            <button className="delete-button" onClick={() => void deleteProduct(product)}>Xóa</button></td>
                    </tr>)}</tbody>
                </table>
                {products.length === 0 && <p className="admin-empty">Chưa có sản phẩm.</p>}
            </div>
        </div>
    );
}

export default ManageProducts;
