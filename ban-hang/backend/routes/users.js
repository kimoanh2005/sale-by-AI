const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get("/", (req, res) => {
    db.query("SELECT id, name, email, role FROM users ORDER BY id DESC", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Lỗi lấy người dùng", error: err.message });
        }
        res.json(results);
    });
});

router.post("/", async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = req.body.role === "admin" ? "admin" : "user";
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
        return res.status(400).json({ message: "Vui lòng nhập tên, email hợp lệ và mật khẩu từ 6 ký tự" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.promise().query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );
        res.status(201).json({ message: "Đã thêm người dùng", userId: result.insertId });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email đã tồn tại" });
        }
        res.status(500).json({ message: "Thêm người dùng thất bại", error: error.message });
    }
});

router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = req.body.role === "admin" ? "admin" : "user";
    const password = String(req.body.password || "");
    if (!Number.isInteger(id) || id < 1 || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Thông tin người dùng không hợp lệ" });
    }
    if (id === req.user.id && role !== req.user.role) {
        return res.status(400).json({ message: "Không thể tự thay đổi quyền quản trị của mình" });
    }
    if (password && password.length < 6) {
        return res.status(400).json({ message: "Mật khẩu cần có ít nhất 6 ký tự" });
    }

    try {
        const values = [name, email, role];
        let sql = "UPDATE users SET name = ?, email = ?, role = ?";
        if (password) {
            sql += ", password = ?";
            values.push(await bcrypt.hash(password, 10));
        }
        sql += " WHERE id = ?";
        values.push(id);
        const [result] = await db.promise().query(sql, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        res.json({ message: "Cập nhật người dùng thành công" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email đã được sử dụng" });
        }
        res.status(500).json({ message: "Cập nhật người dùng thất bại", error: error.message });
    }
});

router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    if (id === req.user.id) {
        return res.status(400).json({ message: "Không thể xóa tài khoản đang đăng nhập" });
    }
    db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Xóa người dùng thất bại", error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        res.json({ message: "Đã xóa người dùng" });
    });
});

module.exports = router;
