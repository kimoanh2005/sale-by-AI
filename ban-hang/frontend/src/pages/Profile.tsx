import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, clearSession, getStoredUser, type User } from "../api";

function Profile() {
    const [user, setUser] = useState<User | null>(getStoredUser());
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        api<{ user: User }>("/auth/me").then(({ user: currentUser }) => {
            setUser(currentUser);
            setName(currentUser.name);
            setEmail(currentUser.email);
        }).catch((requestError: unknown) => {
            setError(requestError instanceof Error ? requestError.message : "Không tải được hồ sơ");
        });
    }, []);

    async function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setMessage("");
        try {
            const result = await api<{ message: string; user: User }>("/auth/me", {
                method: "PUT",
                body: JSON.stringify({ name, email }),
            });
            setUser(result.user);
            localStorage.setItem("oanh_shop_user", JSON.stringify(result.user));
            setMessage(result.message);
            setEditing(false);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Cập nhật hồ sơ thất bại");
        }
    }

    function logout() {
        clearSession();
        navigate("/");
    }

    if (!user) {
        return <div className="page"><h1 className="page-title">Trang cá nhân</h1><div className="profile-box">
            <p>Bạn cần đăng nhập để xem thông tin cá nhân.</p><Link className="profile-link" to="/login">Đăng nhập</Link>
        </div></div>;
    }

    return (
        <div className="page">
            <h1 className="page-title">Trang cá nhân</h1>
            <div className="profile-box">
                <div className="profile-avatar">👤</div>
                {editing ? <form onSubmit={saveProfile}>
                    <div className="form-group"><label htmlFor="profile-name">Họ tên</label>
                        <input id="profile-name" className="form-input" value={name} onChange={(event) => setName(event.target.value)} required /></div>
                    <div className="form-group"><label htmlFor="profile-email">Email</label>
                        <input id="profile-email" className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
                    <button className="form-button" type="submit">Lưu thay đổi</button>
                    <button className="secondary-button" type="button" onClick={() => setEditing(false)}>Hủy</button>
                </form> : <div className="profile-info">
                    <p><strong>Họ tên:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Vai trò:</strong> {user.role === "admin" ? "Quản trị viên" : "Người dùng"}</p>
                    <button className="form-button profile-action" onClick={() => setEditing(true)}>Chỉnh sửa thông tin</button>
                    {user.role === "admin" && <Link className="profile-link" to="/admin">Mở trang quản trị</Link>}
                    <button className="secondary-button" onClick={logout}>Đăng xuất</button>
                </div>}
                {message && <p className="form-message success-message" role="status">{message}</p>}
                {error && <p className="form-message error-message" role="alert">{error}</p>}
            </div>
        </div>
    );
}

export default Profile;
