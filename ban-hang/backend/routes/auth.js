const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function createToken(userId) {
    return jwt.sign(
        { sub: userId },
        process.env.JWT_SECRET || "dev-only-change-this-secret",
        { expiresIn: "7d" }
    );
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

router.post("/register", async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Mật khẩu cần có ít nhất 6 ký tự" });
    }

    try {
        const [existing] = await db.promise().query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: "Email đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.promise().query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
            [name, email, hashedPassword]
        );
        const user = { id: result.insertId, name, email, role: "user" };

        res.status(201).json({
            message: "Đăng ký thành công",
            token: createToken(user.id),
            user
        });
    } catch (error) {
        res.status(500).json({ message: "Đăng ký thất bại", error: error.message });
    }
});

router.post("/login", async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    try {
        const [results] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        const user = publicUser(results[0]);
        res.json({ message: "Đăng nhập thành công", token: createToken(user.id), user });
    } catch (error) {
        res.status(500).json({ message: "Đăng nhập thất bại", error: error.message });
    }
});

router.get("/me", authenticate, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

router.put("/me", authenticate, async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Vui lòng nhập họ tên và email hợp lệ" });
    }

    try {
        const [result] = await db.promise().query(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            [name, email, req.user.id]
        );
        res.json({ message: "Cập nhật thông tin thành công", user: { ...req.user, name, email } });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email đã được sử dụng" });
        }
        res.status(500).json({ message: "Cập nhật thông tin thất bại", error: error.message });
    }
});

module.exports = router;
