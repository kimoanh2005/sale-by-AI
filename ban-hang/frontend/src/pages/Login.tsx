import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveSession, type User } from "../api";

function Login() {
    const [loginRole, setLoginRole] = useState<"user" | "admin">("user");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await api<{ token: string; user: User }>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            if (loginRole === "admin" && result.user.role !== "admin") {
                throw new Error("Tài khoản này chưa được cấp quyền quản trị.");
            }
            saveSession(result.token, result.user);
            navigate(loginRole === "admin" ? "/admin" : "/profile");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page">
            <form className="form-container" onSubmit={handleSubmit}>
                <h1>{loginRole === "admin" ? "Đăng nhập quản trị" : "Đăng nhập"}</h1>
                <div className="login-role-picker" role="group" aria-label="Chọn loại đăng nhập">
                    <button
                        type="button"
                        className={loginRole === "user" ? "login-role-option selected" : "login-role-option"}
                        aria-pressed={loginRole === "user"}
                        onClick={() => setLoginRole("user")}
                    >
                        Người dùng
                    </button>
                    <button
                        type="button"
                        className={loginRole === "admin" ? "login-role-option selected" : "login-role-option"}
                        aria-pressed={loginRole === "admin"}
                        onClick={() => setLoginRole("admin")}
                    >
                        Quản trị viên
                    </button>
                </div>
                {error && <p className="form-message error-message" role="alert">{error}</p>}
                <div className="form-group">
                    <label htmlFor="login-email">Email</label>
                    <input id="login-email" className="form-input" type="email" autoComplete="email"
                        placeholder="Nhập email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="login-password">Mật khẩu</label>
                    <input id="login-password" className="form-input" type="password" autoComplete="current-password"
                        placeholder="Nhập mật khẩu" value={password} onChange={(event) => setPassword(event.target.value)} required />
                </div>
                <button className="form-button" type="submit" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : loginRole === "admin" ? "Đăng nhập quản trị" : "Đăng nhập"}
                </button>
                <p className="form-footer">
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
