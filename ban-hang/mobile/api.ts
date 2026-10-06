import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

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

export interface CartItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    image: string | null;
    quantity: number;
    stock: number;
}

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
const defaultHost = Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
const browserHost = Platform.OS === "web" && typeof window !== "undefined"
    ? window.location.hostname
    : null;
const isLocalBrowserHost = browserHost === "localhost"
    || browserHost === "::1"
    || /^127(?:\.\d{1,3}){3}$/.test(browserHost ?? "")
    || /^10(?:\.\d{1,3}){2}\.\d{1,3}$/.test(browserHost ?? "")
    || /^192\.168(?:\.\d{1,3}){2}$/.test(browserHost ?? "")
    || /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/.test(browserHost ?? "");
const baseUrl = isLocalBrowserHost
    ? `http://${browserHost}:5000`
    : configuredUrl || defaultHost;
const API_URL = /\/api$/i.test(baseUrl)
    ? baseUrl
    : `${baseUrl}/api`;
const TOKEN_KEY = "oanh_shop_token";
const USER_KEY = "oanh_shop_user";

export async function loadSession(): Promise<{ token: string | null; user: User | null }> {
    const [token, storedUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    let user: User | null = null;
    try {
        user = storedUser[1] ? JSON.parse(storedUser[1]) as User : null;
    } catch {
        await AsyncStorage.removeItem(USER_KEY);
    }
    return { token: token[1], user };
}

export async function saveSession(token: string, user: User): Promise<void> {
    await AsyncStorage.multiSet([[TOKEN_KEY, token], [USER_KEY, JSON.stringify(user)]]);
}

export async function saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, { ...init, headers });
    } catch {
        throw new Error(
            `Không kết nối được backend tại ${API_URL}. Hãy bật backend. Điện thoại thật cần đặt EXPO_PUBLIC_API_URL thành IP LAN của máy tính.`
        );
    }

    const data = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) {
        if (response.status === 401) await clearSession();
        throw new Error(`${data.message || `HTTP ${response.status}`} — ${init.method || "GET"} ${path} (${response.url})`);
    }
    return data as T;
}

export function formatPrice(value: number): string {
    return `${Number(value).toLocaleString("vi-VN")} ₫`;
}
