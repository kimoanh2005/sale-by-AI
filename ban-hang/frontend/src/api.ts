export interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
}

export interface Product {
    id: number;
    name: string;
    price: number;
    image: string | null;
    description: string | null;
    quantity: number;
    category_id: number | null;
    category_name?: string | null;
}

export interface Category {
    id: number;
    name: string;
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const API_URL = configuredApiUrl
    ? (/\/api$/i.test(configuredApiUrl) ? configuredApiUrl : `${configuredApiUrl}/api`)
    : "http://localhost:5000/api";
const TOKEN_KEY = "oanh_shop_token";
const USER_KEY = "oanh_shop_user";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored) as User;
    } catch {
        localStorage.removeItem(USER_KEY);
        return null;
    }
}

export function saveSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, { ...init, headers });
    } catch {
        throw new Error("Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy.");
    }

    const data = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) {
        if (response.status === 401) clearSession();
        throw new Error(
            `${data.message || `Máy chủ trả về HTTP ${response.status}`} — ${init.method || "GET"} ${path} (${response.url})`
        );
    }
    return data as T;
}

export function formatPrice(price: number): string {
    return `${Number(price).toLocaleString("vi-VN")} ₫`;
}
