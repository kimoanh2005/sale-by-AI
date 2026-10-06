const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/", (req, res) => {
    const sql = `
        SELECT cart.id, cart.product_id, cart.quantity,
               products.name, products.price, products.image,
               products.quantity AS stock
        FROM cart
        JOIN products ON products.id = cart.product_id
        WHERE cart.user_id = ?
        ORDER BY cart.id DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Lỗi lấy giỏ hàng", error: err.message });
        }
        res.json(results);
    });
});

router.post("/", async (req, res) => {
    const productId = Number(req.body.product_id);
    const quantity = Number(req.body.quantity ?? 1);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Sản phẩm hoặc số lượng không hợp lệ" });
    }

    try {
        const [products] = await db.promise().query(
            "SELECT id, quantity FROM products WHERE id = ?",
            [productId]
        );
        if (products.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        const [items] = await db.promise().query(
            "SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?",
            [req.user.id, productId]
        );
        const updatedQuantity = quantity + (items[0]?.quantity || 0);
        if (updatedQuantity > Number(products[0].quantity)) {
            return res.status(409).json({ message: "Số lượng vượt quá hàng tồn kho" });
        }

        if (items.length > 0) {
            await db.promise().query("UPDATE cart SET quantity = ? WHERE id = ?", [updatedQuantity, items[0].id]);
        } else {
            await db.promise().query(
                "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
                [req.user.id, productId, quantity]
            );
        }
        res.status(201).json({ message: "Đã thêm sản phẩm vào giỏ hàng" });
    } catch (error) {
        res.status(500).json({ message: "Thêm vào giỏ hàng thất bại", error: error.message });
    }
});

router.put("/:id", async (req, res) => {
    const itemId = Number(req.params.id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(itemId) || itemId < 1 || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Số lượng phải là số nguyên lớn hơn 0" });
    }

    try {
        const [items] = await db.promise().query(
            `SELECT cart.id, products.quantity AS stock
             FROM cart JOIN products ON products.id = cart.product_id
             WHERE cart.id = ? AND cart.user_id = ?`,
            [itemId, req.user.id]
        );
        if (items.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });
        }
        if (quantity > Number(items[0].stock)) {
            return res.status(409).json({ message: "Số lượng vượt quá hàng tồn kho" });
        }
        await db.promise().query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, itemId]);
        res.json({ message: "Cập nhật số lượng thành công" });
    } catch (error) {
        res.status(500).json({ message: "Cập nhật giỏ hàng thất bại", error: error.message });
    }
});

router.delete("/:id", (req, res) => {
    db.query(
        "DELETE FROM cart WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Xóa khỏi giỏ hàng thất bại", error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });
            }
            res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
        }
    );
});

module.exports = router;
