import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveSession, type User } from "../api";

function Register() {
    const [name, setName] = useState("");
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
            const result = await api<{ token: string; user: User }>("/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password }),
            });
            saveSession(result.token, result.user);
            navigate("/profile");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page">
            <form className="form-container" onSubmit={handleSubmit}>
                <h1>Tạo tài khoản</h1>
                {error && <p className="form-message error-message" role="alert">{error}</p>}
                <div className="form-group">
                    <label htmlFor="register-name">Họ và tên</label>
                    <input id="register-name" className="form-input" type="text" autoComplete="name"
                        placeholder="Nhập họ và tên" value={name} onChange={(event) => setName(event.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="register-email">Email</label>
                    <input id="register-email" className="form-input" type="email" autoComplete="email"
                        placeholder="Nhập email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="register-password">Mật khẩu (ít nhất 6 ký tự)</label>
                    <input id="register-password" className="form-input" type="password" autoComplete="new-password"
                        minLength={6} placeholder="Tạo mật khẩu" value={password}
                        onChange={(event) => setPassword(event.target.value)} required />
                </div>
                <button className="form-button" type="submit" disabled={loading}>
                    {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                </button>
                <p className="form-footer">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
