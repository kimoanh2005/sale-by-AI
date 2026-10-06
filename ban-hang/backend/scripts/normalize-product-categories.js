const db = require("../db");

const categoryNames = ["Điện thoại", "Laptop", "Tai nghe", "Phụ kiện", "Thời trang", "Đồ uống"];

function normalize(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("vi");
}

function categoryForProduct(name) {
    const productName = normalize(name);
    if (/\b(iphone|samsung|dien thoai)\b/.test(productName)) return "Điện thoại";
    if (/\b(macbook|laptop|notebook)\b/.test(productName)) return "Laptop";
    if (/\b(airpods|tai nghe|headphones?|earbuds?)\b/.test(productName)) return "Tai nghe";
    if (/\b(ao thun|quan jean|quan ao|thoi trang)\b/.test(productName)) return "Thời trang";
    if (/\b(ca phe|coffee|robusta|arabica|do uong)\b/.test(productName)) return "Đồ uống";
    if (/\b(chuot|tui|den ban|binh nuoc|phu kien)\b/.test(productName)) return "Phụ kiện";
    return null;
}

function query(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

async function normalizeProductCategories() {
    try {
        await query("START TRANSACTION");

        const categories = await query("SELECT id, name FROM categories ORDER BY id");
        const canonicalIds = new Map();
        const duplicateIds = new Map();

        for (const category of categories) {
            const key = normalize(category.name);
            if (!canonicalIds.has(key)) canonicalIds.set(key, category.id);
            else duplicateIds.set(category.id, canonicalIds.get(key));
        }

        for (const categoryName of categoryNames) {
            const key = normalize(categoryName);
            if (!canonicalIds.has(key)) {
                const result = await query("INSERT INTO categories (name) VALUES (?)", [categoryName]);
                canonicalIds.set(key, result.insertId);
            }
        }

        const products = await query("SELECT id, name, category_id FROM products ORDER BY id");
        let reassigned = 0;

        for (const product of products) {
            const inferredCategory = categoryForProduct(product.name);
            const canonicalCategoryId = inferredCategory
                ? canonicalIds.get(normalize(inferredCategory))
                : duplicateIds.get(product.category_id) || product.category_id;

            if (canonicalCategoryId && canonicalCategoryId !== product.category_id) {
                await query("UPDATE products SET category_id = ? WHERE id = ?", [canonicalCategoryId, product.id]);
                reassigned++;
            }
        }

        for (const duplicateId of duplicateIds.keys()) {
            await query("DELETE FROM categories WHERE id = ?", [duplicateId]);
        }

        await query("COMMIT");
        console.log(`Đã chuẩn hóa ${products.length} sản phẩm; cập nhật ${reassigned} liên kết danh mục.`);
        console.log(`Danh mục trùng đã gộp: ${duplicateIds.size}.`);
    } catch (error) {
        await query("ROLLBACK");
        throw error;
    } finally {
        db.end();
    }
}

normalizeProductCategories().catch((error) => {
    console.error("Không thể chuẩn hóa danh mục sản phẩm:", error.message);
    process.exitCode = 1;
});
