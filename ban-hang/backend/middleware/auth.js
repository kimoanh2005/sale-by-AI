const jwt = require("jsonwebtoken");
const db = require("../db");

function authenticate(req, res, next) {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET || "dev-only-change-this-secret");
    } catch {
        return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });
    }

    db.query(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [payload.sub],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Không thể xác thực tài khoản", error: err.message });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: "Tài khoản không còn tồn tại" });
            }
            req.user = results[0];
            next();
        }
    );
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }
    next();
}

module.exports = { authenticate, requireAdmin };
