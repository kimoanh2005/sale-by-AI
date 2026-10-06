const express = require("express");
const cors = require("cors");

const db = require("./db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

// API đăng ký / đăng nhập
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);

// Kiểm tra server
app.get("/", (req, res) => {
    res.json({
        message: "Backend bán hàng đang chạy!"
    });
});

// Kiểm tra database
app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 AS result", (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Lỗi kết nối database",
                error: err.message
            });
        }

        res.json({
            message: "Kết nối database thành công!",
            data: results
        });
    });
});

app.use((req, res) => {
    res.status(404).json({
        message: "Không tìm thấy API",
        method: req.method,
        path: req.originalUrl
    });
});

app.listen(5000, "0.0.0.0", () => {
    console.log("Server chạy tại http://localhost:5000");
    console.log("Backend cũng nhận kết nối từ các thiết bị trong mạng LAN.");
});