import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, type User } from "../api";

interface UserForm {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
}
const emptyForm: UserForm = { name: "", email: "", password: "", role: "user" };

function ManageUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState<UserForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadUsers = useCallback(async () => setUsers(await api<User[]>("/users")), []);
    useEffect(() => {
        loadUsers().catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Không tải được người dùng"));
    }, [loadUsers]);

    function editUser(user: User) {
        setEditingId(user.id);
        setForm({ name: user.name, email: user.email, password: "", role: user.role });
        setError("");
        setMessage("");
    }

    async function saveUser(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setMessage("");
        const payload = { ...form };
        if (!payload.password) delete (payload as Partial<UserForm>).password;
        try {
            const result = await api<{ message: string }>(editingId ? `/users/${editingId}` : "/users", {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });
            await loadUsers();
            setMessage(result.message);
            setForm(emptyForm);
            setEditingId(null);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể lưu người dùng");
        }
    }

    async function deleteUser(user: User) {
        if (!window.confirm(`Xóa tài khoản ${user.email}?`)) return;
        setError("");
        try {
            await api(`/users/${user.id}`, { method: "DELETE" });
            await loadUsers();
            if (editingId === user.id) {
                setEditingId(null);
                setForm(emptyForm);
            }
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể xóa người dùng");
        }
    }

    return (
        <div>
            <div className="admin-title-row">
                <div><h1 className="admin-page-title">Quản lý người dùng</h1><p className="admin-description">Tạo, cập nhật và xóa tài khoản.</p></div>
                <button className="admin-primary-button" onClick={() => { setEditingId(null); setForm(emptyForm); setError(""); }}>+ Thêm người dùng</button>
            </div>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {message && <p className="form-message success-message" role="status">{message}</p>}
            <form className="admin-form" onSubmit={saveUser}>
                <h2>{editingId ? "Cập nhật người dùng" : "Thêm người dùng mới"}</h2>
                <div className="admin-form-grid">
                    <label>Họ tên<input className="form-input" value={form.name} required
                        onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                    <label>Email<input className="form-input" type="email" value={form.email} required
                        onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                    <label>{editingId ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                        <input className="form-input" type="password" minLength={6} required={!editingId} value={form.password}
                            onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
                    <label>Vai trò<select className="form-input" value={form.role}
                        onChange={(event) => setForm({ ...form, role: event.target.value as UserForm["role"] })}>
                        <option value="user">Người dùng</option><option value="admin">Quản trị viên</option>
                    </select></label>
                </div>
                <button className="admin-primary-button" type="submit">{editingId ? "Lưu thay đổi" : "Tạo tài khoản"}</button>
                {editingId && <button className="secondary-button inline-button" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy sửa</button>}
            </form>
            <div className="admin-table-box">
                <table className="admin-table">
                    <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
                    <tbody>{users.map((user) => <tr key={user.id}>
                        <td>{user.id}</td><td><strong>{user.name}</strong></td><td>{user.email}</td>
                        <td><span className={user.role === "admin" ? "role-admin" : "role-user"}>{user.role === "admin" ? "Quản trị viên" : "Người dùng"}</span></td>
                        <td><button className="edit-button" onClick={() => editUser(user)}>Sửa</button>
                            <button className="delete-button" onClick={() => void deleteUser(user)}>Xóa</button></td>
                    </tr>)}</tbody>
                </table>
                {users.length === 0 && <p className="admin-empty">Chưa có người dùng.</p>}
            </div>
        </div>
    );
}

export default ManageUsers;
