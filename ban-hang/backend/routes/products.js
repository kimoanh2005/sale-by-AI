const express = require("express");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/categories", (req, res) => {
    db.query("SELECT id, name FROM categories ORDER BY name", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Lỗi lấy danh mục", error: err.message });
        }
        res.json(results);
    });
});


// =====================================================
// 1. LẤY TẤT CẢ SẢN PHẨM
// GET /api/products
// =====================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            products.id,
            products.name,
            products.price,
            products.image,
            products.description,
            products.quantity,
            products.category_id,
            categories.name AS category_name
        FROM products
        LEFT JOIN categories
            ON products.category_id = categories.id
        ORDER BY products.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Lỗi lấy danh sách sản phẩm",
                error: err.message
            });
        }

        res.json(results);
    });
});


// =====================================================
// 2. LẤY CHI TIẾT MỘT SẢN PHẨM
// GET /api/products/:id
// =====================================================

router.get("/:id", (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT
            products.id,
            products.name,
            products.price,
            products.image,
            products.description,
            products.quantity,
            products.category_id,
            categories.name AS category_name
        FROM products
        LEFT JOIN categories
            ON products.category_id = categories.id
        WHERE products.id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Lỗi lấy sản phẩm",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });
        }

        res.json(results[0]);
    });
});


// =====================================================
// 3. THÊM SẢN PHẨM
// POST /api/products
// =====================================================

router.post("/", authenticate, requireAdmin, (req, res) => {

    const {
        name,
        price,
        image,
        description,
        quantity,
        category_id
    } = req.body;


    // Kiểm tra dữ liệu
    if (!String(name || "").trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
        return res.status(400).json({
            message: "Vui lòng nhập tên và giá sản phẩm hợp lệ"
        });
    }
    if (quantity !== undefined && (!Number.isInteger(Number(quantity)) || Number(quantity) < 0)) {
        return res.status(400).json({ message: "Số lượng phải là số nguyên không âm" });
    }


    const sql = `
        INSERT INTO products
        (
            name,
            price,
            image,
            description,
            quantity,
            category_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            name,
            price,
            image || null,
            description || null,
            quantity || 0,
            category_id || null
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Thêm sản phẩm thất bại",
                    error: err.message
                });
            }


            res.status(201).json({
                message: "Thêm sản phẩm thành công",
                productId: result.insertId
            });
        }
    );
});


// =====================================================
// 4. SỬA SẢN PHẨM
// PUT /api/products/:id
// =====================================================

router.put("/:id", authenticate, requireAdmin, (req, res) => {

    const { id } = req.params;

    const {
        name,
        price,
        image,
        description,
        quantity,
        category_id
    } = req.body;


    if (!String(name || "").trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
        return res.status(400).json({
            message: "Vui lòng nhập tên và giá sản phẩm hợp lệ"
        });
    }
    if (quantity !== undefined && (!Number.isInteger(Number(quantity)) || Number(quantity) < 0)) {
        return res.status(400).json({ message: "Số lượng phải là số nguyên không âm" });
    }


    const sql = `
        UPDATE products
        SET
            name = ?,
            price = ?,
            image = ?,
            description = ?,
            quantity = ?,
            category_id = ?
        WHERE id = ?
    `;


    db.query(
        sql,
        [
            name,
            price,
            image || null,
            description || null,
            quantity || 0,
            category_id || null,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Sửa sản phẩm thất bại",
                    error: err.message
                });
            }


            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy sản phẩm"
                });
            }


            res.json({
                message: "Cập nhật sản phẩm thành công"
            });
        }
    );
});


// =====================================================
// 5. XÓA SẢN PHẨM
// DELETE /api/products/:id
// =====================================================

router.delete("/:id", authenticate, requireAdmin, (req, res) => {

    const { id } = req.params;


    const sql = `
        DELETE FROM products
        WHERE id = ?
    `;


    db.query(sql, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Xóa sản phẩm thất bại",
                error: err.message
            });
        }


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });
        }


        res.json({
            message: "Xóa sản phẩm thành công"
        });
    });
});


module.exports = router;