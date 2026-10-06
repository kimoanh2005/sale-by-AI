import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
    NavigationContainer,
    type NavigationProp,
    type NavigatorScreenParams,
    useNavigation,
    useRoute,
    useFocusEffect,
    type RouteProp,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
    api,
    clearSession,
    formatPrice,
    loadSession,
    saveSession,
    saveUser,
    type CartItem,
    type Category,
    type Product,
    type User,
} from "./api";

type RootStackParamList = {
    Store: NavigatorScreenParams<TabParamList> | undefined;
    Login: undefined;
    Register: undefined;
    ProductDetail: { productId: number };
    Admin: undefined;
    AdminProducts: undefined;
    ProductForm: { product?: Product } | undefined;
    AdminUsers: undefined;
    UserForm: { user?: User } | undefined;
};

type TabParamList = {
    Home: undefined;
    Products: { categoryId?: number; search?: string } | undefined;
    Cart: undefined;
    Profile: undefined;
    Admin: undefined;
};

type AppNavigation = NavigationProp<RootStackParamList & TabParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

interface AuthContextValue {
    user: User | null;
    ready: boolean;
    signIn(email: string, password: string): Promise<User>;
    register(name: string, email: string, password: string): Promise<void>;
    updateUser(user: User): Promise<void>;
    signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("AuthContext is unavailable");
    return context;
}

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : "Đã có lỗi xảy ra";
}

function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let active = true;
        async function restoreSession() {
            const stored = await loadSession();
            if (!active) return;
            setUser(stored.user);
            setReady(true);
            if (!stored.token) return;
            try {
                const result = await api<{ user: User }>("/auth/me");
                if (active) {
                    setUser(result.user);
                    await saveUser(result.user);
                }
            } catch {
                const current = await loadSession();
                if (active) setUser(current.token ? current.user : null);
            }
        }
        void restoreSession();
        return () => { active = false; };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const result = await api<{ token: string; user: User }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        await saveSession(result.token, result.user);
        setUser(result.user);
        return result.user;
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const result = await api<{ token: string; user: User }>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
        });
        await saveSession(result.token, result.user);
        setUser(result.user);
    }, []);

    const updateUser = useCallback(async (updated: User) => {
        await saveUser(updated);
        setUser(updated);
    }, []);

    const signOut = useCallback(async () => {
        await clearSession();
        setUser(null);
    }, []);

    return <AuthContext.Provider value={{ user, ready, signIn, register, updateUser, signOut }}>{children}</AuthContext.Provider>;
}

function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            {scroll ? <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">{children}</ScrollView> : children}
        </SafeAreaView>
    );
}

function Title({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
    return <View style={styles.titleBlock}>
        <Text style={styles.pageTitle}>{children}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>;
}

function ActionButton({
    title,
    onPress,
    secondary = false,
    disabled = false,
}: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    disabled?: boolean;
}) {
    return <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
            styles.button,
            secondary && styles.secondaryButton,
            disabled && styles.disabledButton,
            pressed && !disabled && styles.pressed,
        ]}
    >
        <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </Pressable>;
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    multiline,
    numberOfLines,
}: {
    label: string;
    value: string;
    onChangeText(value: string): void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "decimal-pad";
    multiline?: boolean;
    numberOfLines?: number;
}) {
    return <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9a91a8"
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
            multiline={multiline}
            numberOfLines={numberOfLines}
            style={[styles.input, multiline && styles.multilineInput]}
        />
    </View>;
}

function Notice({ text, success = false }: { text: string; success?: boolean }) {
    return <View style={[styles.notice, success ? styles.successNotice : styles.errorNotice]}>
        <Text style={success ? styles.successText : styles.errorText}>{text}</Text>
    </View>;
}

function ProductImage({ uri, large = false, compact = false }: { uri?: string | null; large?: boolean; compact?: boolean }) {
    const imageStyle = large ? styles.detailImage : compact ? styles.cartImage : styles.productImage;
    if (uri) return <Image source={{ uri }} resizeMode="cover" style={imageStyle} />;
    return <View style={[imageStyle, styles.imagePlaceholder]}>
        <Text style={large ? styles.placeholderIconLarge : compact ? styles.cartPlaceholderIcon : styles.placeholderIcon}>🛍️</Text>
    </View>;
}

function ProductCard({ product }: { product: Product }) {
    const navigation = useNavigation<AppNavigation>();
    return <Pressable style={styles.productCard} onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}>
        <ProductImage uri={product.image} />
        <View style={styles.productCardBody}>
            <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            <Text style={styles.cardMeta}>{product.category_name || "Chưa phân loại"} · Còn {product.quantity}</Text>
        </View>
    </Pressable>;
}

function categoryIcon(name: string): string {
    const icons: Record<string, string> = {
        "Điện thoại": "📱",
        Laptop: "💻",
        "Tai nghe": "🎧",
        "Phụ kiện": "🧩",
        "Thời trang": "👕",
        "Đồ uống": "☕",
    };
    return icons[name] || "📦";
}

function HomeScreen() {
    const navigation = useNavigation<AppNavigation>();
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api<Category[]>("/products/categories"), api<Product[]>("/products")])
            .then(([categoryData, productData]) => {
                setCategories(categoryData);
                setProducts(productData.slice(0, 4));
            })
            .catch((requestError: unknown) => setError(messageOf(requestError)));
    }, []);

    function searchProducts() {
        navigation.navigate("Store", { screen: "Products", params: { search: search.trim() } });
    }

    return <Screen>
        <View style={styles.homeHeader}>
            <View><Text style={styles.greeting}>Xin chào 👋</Text><Text style={styles.brandTitle}>{user?.name || "Oanh Shop"}</Text></View>
            <Pressable style={styles.avatar} onPress={() => navigation.navigate("Profile")}><Text style={styles.avatarText}>👤</Text></Pressable>
        </View>
        <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput value={search} onChangeText={setSearch} placeholder="Tìm sản phẩm..."
                placeholderTextColor="#91899f" style={styles.searchInput} returnKeyType="search" onSubmitEditing={searchProducts} />
            <Pressable onPress={searchProducts}><Text style={styles.searchGo}>Tìm</Text></Pressable>
        </View>
        <View style={styles.banner}>
            <Text style={styles.bannerKicker}>✨ CHÀO MỪNG ĐẾN OANH SHOP</Text>
            <Text style={styles.bannerTitle}>Mua sắm{`\n`}dễ dàng hơn</Text>
            <ActionButton title="Khám phá ngay  →" onPress={() => navigation.navigate("Products")} />
            <Text style={styles.bannerDecor}>🛍️</Text>
        </View>
        <SectionHeader title="Danh mục" action="Tất cả" onPress={() => navigation.navigate("Products")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((category) => <Pressable key={category.id} style={styles.categoryChip}
                onPress={() => navigation.navigate("Store", { screen: "Products", params: { categoryId: category.id } })}>
                <Text style={styles.categoryIcon}>{categoryIcon(category.name)}</Text>
                <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
            </Pressable>)}
            {categories.length === 0 && !error ? <Text style={styles.muted}>Chưa có danh mục.</Text> : null}
        </ScrollView>
        <SectionHeader title="Sản phẩm nổi bật" action="Xem tất cả" onPress={() => navigation.navigate("Products")} />
        {error ? <Notice text={error} /> : null}
        <View style={styles.productGrid}>
            {products.map((product) => <View key={product.id} style={styles.gridItem}><ProductCard product={product} /></View>)}
            {products.length === 0 && !error ? <Text style={styles.muted}>Chưa có sản phẩm.</Text> : null}
        </View>
    </Screen>;
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
    return <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && onPress ? <Pressable onPress={onPress}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>;
}

function ProductsScreen() {
    const route = useRoute<RouteProp<TabParamList, "Products">>();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number | null>(route.params?.categoryId ?? null);
    const [search, setSearch] = useState(route.params?.search ?? "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setError("");
        try {
            const [productData, categoryData] = await Promise.all([
                api<Product[]>("/products"),
                api<Category[]>("/products/categories"),
            ]);
            setProducts(productData);
            setCategories(categoryData);
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        void load();
    }, [load]));

    useEffect(() => {
        setCategoryId(route.params?.categoryId ?? null);
        setSearch(route.params?.search ?? "");
    }, [route.params?.categoryId, route.params?.search]);

    const filtered = products.filter((product) => {
        const selected = categoryId === null || Number(product.category_id) === categoryId;
        const query = search.trim().toLocaleLowerCase("vi");
        const matches = !query || `${product.name} ${product.category_name || ""}`.toLocaleLowerCase("vi").includes(query);
        return selected && matches;
    });

    return <Screen>
        <Title subtitle="Chọn sản phẩm bạn yêu thích">Sản phẩm</Title>
        <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput value={search} onChangeText={setSearch} placeholder="Tìm sản phẩm..."
                placeholderTextColor="#91899f" style={styles.searchInput} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Pressable onPress={() => setCategoryId(null)} style={[styles.filterChip, categoryId === null && styles.filterChipActive]}>
                <Text style={[styles.filterText, categoryId === null && styles.filterTextActive]}>Tất cả</Text>
            </Pressable>
            {categories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)}
                style={[styles.filterChip, categoryId === category.id && styles.filterChipActive]}>
                <Text style={[styles.filterText, categoryId === category.id && styles.filterTextActive]}>{category.name}</Text>
            </Pressable>)}
        </ScrollView>
        {loading ? <Loading /> : error ? <Notice text={error} /> : filtered.length === 0
            ? <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp.</Text>
            : <View style={styles.productGrid}>{filtered.map((product) =>
                <View key={product.id} style={styles.gridItem}><ProductCard product={product} /></View>)}</View>}
    </Screen>;
}

function ProductDetailScreen() {
    const route = useRoute<RouteProp<RootStackParamList, "ProductDetail">>();
    const navigation = useNavigation<AppNavigation>();
    const { user } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api<Product>(`/products/${route.params.productId}`).then(setProduct)
            .catch((requestError: unknown) => setError(messageOf(requestError)))
            .finally(() => setLoading(false));
    }, [route.params.productId]);

    async function addToCart() {
        if (!user) {
            Alert.alert("Cần đăng nhập", "Đăng nhập để thêm sản phẩm vào giỏ hàng.", [
                { text: "Để sau", style: "cancel" },
                { text: "Đăng nhập", onPress: () => navigation.navigate("Login") },
            ]);
            return;
        }
        if (!product) return;
        setError("");
        setMessage("");
        try {
            const result = await api<{ message: string }>("/cart", {
                method: "POST",
                body: JSON.stringify({ product_id: product.id, quantity }),
            });
            setMessage(result.message);
        } catch (requestError) {
            setError(messageOf(requestError));
        }
    }

    if (loading) return <Screen><Loading /></Screen>;
    if (!product) return <Screen><Notice text={error || "Không tìm thấy sản phẩm"} /><ActionButton title="Quay lại" secondary onPress={() => navigation.goBack()} /></Screen>;

    return <Screen>
        <ProductImage uri={product.image} large />
        <View style={styles.detailBody}>
            <Text style={styles.detailCategory}>{product.category_name || "Oanh Shop"}</Text>
            <Text style={styles.detailTitle}>{product.name}</Text>
            <Text style={styles.detailPrice}>{formatPrice(product.price)}</Text>
            <Text style={styles.detailDescription}>{product.description || "Sản phẩm chất lượng từ Oanh Shop."}</Text>
            <Text style={styles.stockText}>Còn hàng: {product.quantity}</Text>
            {product.quantity > 0 ? <>
                <View style={styles.quantityRow}>
                    <Text style={styles.fieldLabel}>Số lượng</Text>
                    <View style={styles.quantityControl}>
                        <Pressable style={styles.quantityButton} disabled={quantity <= 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))}>
                            <Text style={styles.quantityButtonText}>−</Text>
                        </Pressable>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <Pressable style={styles.quantityButton} disabled={quantity >= product.quantity} onPress={() => setQuantity((value) => Math.min(product.quantity, value + 1))}>
                            <Text style={styles.quantityButtonText}>+</Text>
                        </Pressable>
                    </View>
                </View>
                <ActionButton title="🛒  Thêm vào giỏ hàng" onPress={() => void addToCart()} />
            </> : <Notice text="Sản phẩm hiện đã hết hàng." />}
            {message ? <Notice text={message} success /> : null}
            {error ? <Notice text={error} /> : null}
        </View>
    </Screen>;
}

function CartScreen() {
    const navigation = useNavigation<AppNavigation>();
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setItems(await api<CartItem[]>("/cart"));
            setError("");
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        if (user) void load();
        else setLoading(false);
    }, [load, user]));

    async function updateQuantity(item: CartItem, quantity: number) {
        try {
            await api(`/cart/${item.id}`, { method: "PUT", body: JSON.stringify({ quantity }) });
            await load();
        } catch (requestError) {
            setError(messageOf(requestError));
        }
    }

    function removeItem(item: CartItem) {
        Alert.alert("Xóa khỏi giỏ hàng", `Xóa "${item.name}" khỏi giỏ hàng?`, [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", style: "destructive", onPress: () => {
                void api(`/cart/${item.id}`, { method: "DELETE" }).then(load)
                    .catch((requestError: unknown) => setError(messageOf(requestError)));
            } },
        ]);
    }

    if (!user) return <Screen>
        <Title>Giỏ hàng</Title>
        <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Đăng nhập để lưu và xem giỏ hàng của bạn.</Text>
            <ActionButton title="Đăng nhập" onPress={() => navigation.navigate("Login")} />
        </View>
    </Screen>;

    const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    return <Screen>
        <Title subtitle={`${items.length} sản phẩm trong giỏ`}>Giỏ hàng</Title>
        {loading ? <Loading /> : error ? <Notice text={error} /> : items.length === 0
            ? <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
                <ActionButton title="Tiếp tục mua sắm" onPress={() => navigation.navigate("Products")} />
            </View>
            : <>
                {items.map((item) => <View key={item.id} style={styles.cartCard}>
                    <ProductImage uri={item.image} compact />
                    <View style={styles.cartDetails}>
                        <View style={styles.cartItemHeader}>
                            <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Xóa ${item.name} khỏi giỏ hàng`}
                                hitSlop={8}
                                onPress={() => removeItem(item)}
                                style={styles.cartRemoveButton}
                            >
                                <Text style={styles.cartRemoveIcon}>×</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                        <View style={styles.cartBottomRow}>
                            <View style={styles.quantityControl}>
                                <Pressable style={styles.quantityButton} disabled={item.quantity <= 1} onPress={() => void updateQuantity(item, item.quantity - 1)}>
                                    <Text style={styles.quantityButtonText}>−</Text>
                                </Pressable>
                                <Text style={styles.quantityValue}>{item.quantity}</Text>
                                <Pressable style={styles.quantityButton} disabled={item.quantity >= item.stock} onPress={() => void updateQuantity(item, item.quantity + 1)}>
                                    <Text style={styles.quantityButtonText}>+</Text>
                                </Pressable>
                            </View>
                            <Text style={styles.cartLineTotal}>{formatPrice(Number(item.price) * item.quantity)}</Text>
                        </View>
                    </View>
                </View>)}
                <View style={styles.totalCard}>
                    <View style={styles.totalHeading}>
                        <Text style={styles.totalLabel}>Tạm tính ({items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)</Text>
                        <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
                    </View>
                    <View style={styles.totalDivider} />
                    <Text style={styles.totalHint}>Phí vận chuyển sẽ được xác nhận khi đặt hàng.</Text>
                    <ActionButton title="Tiếp tục mua sắm" secondary onPress={() => navigation.navigate("Products")} />
                </View>
            </>}
    </Screen>;
}

function ProfileScreen() {
    const navigation = useNavigation<AppNavigation>();
    const { user, updateUser, signOut } = useAuth();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        setName(user?.name || "");
        setEmail(user?.email || "");
    }, [user]);

    async function saveProfile() {
        setError("");
        setMessage("");
        try {
            const result = await api<{ message: string; user: User }>("/auth/me", {
                method: "PUT",
                body: JSON.stringify({ name, email }),
            });
            await updateUser(result.user);
            setMessage(result.message);
            setEditing(false);
        } catch (requestError) {
            setError(messageOf(requestError));
        }
    }

    async function logout() {
        await signOut();
        setEditing(false);
        navigation.navigate("Home");
    }

    if (!user) return <Screen>
        <Title>Trang cá nhân</Title>
        <View style={styles.profileCard}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>Đăng nhập để xem thông tin cá nhân.</Text>
            <ActionButton title="Đăng nhập" onPress={() => navigation.navigate("Login")} />
            <ActionButton title="Tạo tài khoản" secondary onPress={() => navigation.navigate("Register")} />
        </View>
    </Screen>;

    return <Screen>
        <Title subtitle="Thông tin tài khoản của bạn">Trang cá nhân</Title>
        <View style={styles.profileCard}>
            <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>👤</Text></View>
            {editing ? <>
                <Field label="Họ tên" value={name} onChangeText={setName} />
                <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <ActionButton title="Lưu thay đổi" onPress={() => void saveProfile()} />
                <ActionButton title="Hủy" secondary onPress={() => setEditing(false)} />
            </> : <>
                <ProfileLine label="Họ tên" value={user.name} />
                <ProfileLine label="Email" value={user.email} />
                <ProfileLine label="Vai trò" value={user.role === "admin" ? "Quản trị viên" : "Người dùng"} />
                <ActionButton title="Chỉnh sửa thông tin" onPress={() => setEditing(true)} />
                {user.role === "admin" ? <ActionButton title="⚙  Quản trị cửa hàng" secondary onPress={() => navigation.navigate("Admin")} /> : null}
                <ActionButton title="Đăng xuất" secondary onPress={() => void logout()} />
            </>}
            {message ? <Notice text={message} success /> : null}
            {error ? <Notice text={error} /> : null}
        </View>
    </Screen>;
}

function ProfileLine({ label, value }: { label: string; value: string }) {
    return <View style={styles.profileLine}>
        <Text style={styles.profileLineLabel}>{label}</Text>
        <Text style={styles.profileLineValue}>{value}</Text>
    </View>;
}

function LoginScreen() {
    const navigation = useNavigation<AppNavigation>();
    const { signIn, signOut } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminMode, setAdminMode] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit() {
        setError("");
        setLoading(true);
        try {
            const authenticatedUser = await signIn(email.trim(), password);
            if (adminMode && authenticatedUser.role !== "admin") {
                await signOut();
                throw new Error("Tài khoản này chưa được cấp quyền quản trị. Hãy dùng tài khoản admin hoặc đăng nhập thường.");
            }
            navigation.reset({
                index: 0,
                routes: [{
                    name: "Store",
                    params: adminMode ? { screen: "Admin" } : undefined,
                }],
            });
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setLoading(false);
        }
    }

    return <AuthForm>
        <Text style={styles.authEyebrow}>OANH SHOP</Text>
        <Text style={styles.authTitle}>Chào mừng trở lại</Text>
        <Text style={styles.subtitle}>{adminMode ? "Đăng nhập vào trang quản trị" : "Đăng nhập để tiếp tục mua sắm"}</Text>
        <View style={styles.loginRolePicker}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !adminMode }}
                style={[styles.loginRoleOption, !adminMode && styles.loginRoleOptionSelected]}
                onPress={() => { setAdminMode(false); setError(""); }}
            >
                <Text style={[styles.loginRoleText, !adminMode && styles.loginRoleTextSelected]}>Người dùng</Text>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: adminMode }}
                style={[styles.loginRoleOption, adminMode && styles.loginRoleOptionSelected]}
                onPress={() => { setAdminMode(true); setError(""); }}
            >
                <Text style={[styles.loginRoleText, adminMode && styles.loginRoleTextSelected]}>Quản trị viên</Text>
            </Pressable>
        </View>
        {error ? <Notice text={error} /> : null}
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" />
        <Field label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="Nhập mật khẩu" secureTextEntry />
        <ActionButton title={loading ? "Đang đăng nhập..." : adminMode ? "Đăng nhập quản trị" : "Đăng nhập"} disabled={loading} onPress={() => void submit()} />
        <Pressable onPress={() => navigation.navigate("Register")} style={styles.authLinkRow}>
            <Text style={styles.authLinkMuted}>Chưa có tài khoản? </Text><Text style={styles.authLink}>Đăng ký ngay</Text>
        </Pressable>
    </AuthForm>;
}

function RegisterScreen() {
    const navigation = useNavigation<AppNavigation>();
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit() {
        setError("");
        setLoading(true);
        try {
            await register(name.trim(), email.trim(), password);
            navigation.reset({ index: 0, routes: [{ name: "Store" }] });
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setLoading(false);
        }
    }

    return <AuthForm>
        <Text style={styles.authEyebrow}>OANH SHOP</Text>
        <Text style={styles.authTitle}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Đăng ký để bắt đầu mua sắm</Text>
        {error ? <Notice text={error} /> : null}
        <Field label="Họ và tên" value={name} onChangeText={setName} placeholder="Nhập họ tên" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" />
        <Field label="Mật khẩu (ít nhất 6 ký tự)" value={password} onChangeText={setPassword} placeholder="Tạo mật khẩu" secureTextEntry />
        <ActionButton title={loading ? "Đang tạo tài khoản..." : "Đăng ký"} disabled={loading} onPress={() => void submit()} />
        <Pressable onPress={() => navigation.navigate("Login")} style={styles.authLinkRow}>
            <Text style={styles.authLinkMuted}>Đã có tài khoản? </Text><Text style={styles.authLink}>Đăng nhập</Text>
        </Pressable>
    </AuthForm>;
}

function AuthForm({ children }: { children: React.ReactNode }) {
    return <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={styles.authScreen} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>;
}

function AdminScreen() {
    const navigation = useNavigation<AppNavigation>();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api<Product[]>("/products"), api<User[]>("/users"), api<Category[]>("/products/categories")])
            .then(([productData, userData, categoryData]) => {
                setProducts(productData);
                setUsers(userData);
                setCategories(categoryData);
            })
            .catch((requestError: unknown) => setError(messageOf(requestError)));
    }, []);

    if (user?.role !== "admin") return <Screen>
        <Title>Không có quyền</Title><Notice text="Tài khoản không có quyền quản trị." />
    </Screen>;

    return <Screen>
        <Title subtitle="Quản lý cửa hàng của bạn">Quản trị Oanh Shop</Title>
        {error ? <Notice text={error} /> : null}
        <View style={styles.statsRow}>
            <StatCard icon="📦" label="Sản phẩm" value={String(products.length)} />
            <StatCard icon="👥" label="Người dùng" value={String(users.length)} />
            <StatCard icon="🏷️" label="Danh mục" value={String(categories.length)} />
        </View>
        <AdminMenuButton title="📦  Quản lý sản phẩm" subtitle="Thêm, sửa, xóa sản phẩm" onPress={() => navigation.navigate("AdminProducts")} />
        <AdminMenuButton title="👥  Quản lý người dùng" subtitle="Tạo, sửa, xóa tài khoản" onPress={() => navigation.navigate("AdminUsers")} />
    </Screen>;
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return <View style={styles.statCard}><Text style={styles.statIcon}>{icon}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function AdminMenuButton({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
    return <Pressable style={styles.adminMenuButton} onPress={onPress}>
        <View style={styles.adminMenuText}><Text style={styles.adminMenuTitle}>{title}</Text><Text style={styles.adminMenuSubtitle}>{subtitle}</Text></View>
        <Text style={styles.chevron}>›</Text>
    </Pressable>;
}

function AdminProductsScreen() {
    const navigation = useNavigation<AppNavigation>();
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        try {
            setProducts(await api<Product[]>("/products"));
            setError("");
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setLoading(false);
        }
    }, []);
    useFocusEffect(useCallback(() => {
        void load();
    }, [load]));

    function deleteProduct(product: Product) {
        Alert.alert("Xóa sản phẩm", `Xóa "${product.name}"?`, [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", style: "destructive", onPress: () => {
                void api(`/products/${product.id}`, { method: "DELETE" }).then(load)
                    .catch((requestError: unknown) => setError(messageOf(requestError)));
            } },
        ]);
    }

    return <Screen>
        <Title subtitle="Thêm, cập nhật và xóa sản phẩm">Quản lý sản phẩm</Title>
        <ActionButton title="+  Thêm sản phẩm mới" onPress={() => navigation.navigate("ProductForm")} />
        {error ? <Notice text={error} /> : null}
        {loading ? <Loading /> : products.map((product) => <View style={styles.adminRow} key={product.id}>
            <ProductImage uri={product.image} />
            <View style={styles.adminRowInfo}>
                <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                <Text style={styles.cardMeta}>Kho: {product.quantity}</Text>
                <View style={styles.adminActions}>
                    <Pressable style={styles.smallEditButton} onPress={() => navigation.navigate("ProductForm", { product })}>
                        <Text style={styles.smallEditText}>Sửa</Text>
                    </Pressable>
                    <Pressable style={styles.smallDeleteButton} onPress={() => deleteProduct(product)}>
                        <Text style={styles.smallDeleteText}>Xóa</Text>
                    </Pressable>
                </View>
            </View>
        </View>)}
        {!loading && products.length === 0 && !error ? <Text style={styles.emptyText}>Chưa có sản phẩm.</Text> : null}
    </Screen>;
}

function ProductFormScreen() {
    const navigation = useNavigation<AppNavigation>();
    const route = useRoute<RouteProp<RootStackParamList, "ProductForm">>();
    const current = route.params?.product;
    const [name, setName] = useState(current?.name || "");
    const [price, setPrice] = useState(current ? String(current.price) : "");
    const [image, setImage] = useState(current?.image || "");
    const [description, setDescription] = useState(current?.description || "");
    const [quantity, setQuantity] = useState(current ? String(current.quantity) : "0");
    const [categoryId, setCategoryId] = useState(current?.category_id ? String(current.category_id) : "");
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api<Category[]>("/products/categories").then(setCategories)
            .catch((requestError: unknown) => setError(messageOf(requestError)));
    }, []);

    async function saveProduct() {
        const numericPrice = Number(price);
        const numericQuantity = Number(quantity);
        if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 ||
            !Number.isInteger(numericQuantity) || numericQuantity < 0) {
            setError("Vui lòng nhập tên, giá và số lượng hợp lệ.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await api(current ? `/products/${current.id}` : "/products", {
                method: current ? "PUT" : "POST",
                body: JSON.stringify({
                    name: name.trim(),
                    price: numericPrice,
                    image: image.trim() || null,
                    description: description.trim() || null,
                    quantity: numericQuantity,
                    category_id: categoryId ? Number(categoryId) : null,
                }),
            });
            navigation.goBack();
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setSaving(false);
        }
    }

    return <Screen>
        <Title>{current ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</Title>
        {error ? <Notice text={error} /> : null}
        <Field label="Tên sản phẩm" value={name} onChangeText={setName} placeholder="Tên sản phẩm" />
        <Field label="Giá (VNĐ)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
        <Field label="Số lượng tồn kho" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" />
        <Text style={styles.fieldLabel}>Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Pressable onPress={() => setCategoryId("")} style={[styles.filterChip, !categoryId && styles.filterChipActive]}>
                <Text style={[styles.filterText, !categoryId && styles.filterTextActive]}>Chưa phân loại</Text>
            </Pressable>
            {categories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(String(category.id))}
                style={[styles.filterChip, categoryId === String(category.id) && styles.filterChipActive]}>
                <Text style={[styles.filterText, categoryId === String(category.id) && styles.filterTextActive]}>{category.name}</Text>
            </Pressable>)}
        </ScrollView>
        <Field label="URL hình ảnh" value={image} onChangeText={setImage} placeholder="https://..." />
        <Field label="Mô tả" value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Mô tả sản phẩm" />
        <ActionButton title={saving ? "Đang lưu..." : "Lưu sản phẩm"} disabled={saving} onPress={() => void saveProduct()} />
    </Screen>;
}

function AdminUsersScreen() {
    const navigation = useNavigation<AppNavigation>();
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        try {
            setUsers(await api<User[]>("/users"));
            setError("");
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setLoading(false);
        }
    }, []);
    useFocusEffect(useCallback(() => {
        void load();
    }, [load]));

    function deleteUser(user: User) {
        Alert.alert("Xóa tài khoản", `Xóa tài khoản ${user.email}?`, [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", style: "destructive", onPress: () => {
                void api(`/users/${user.id}`, { method: "DELETE" }).then(load)
                    .catch((requestError: unknown) => setError(messageOf(requestError)));
            } },
        ]);
    }

    return <Screen>
        <Title subtitle="Tạo, cập nhật và xóa tài khoản">Quản lý người dùng</Title>
        <ActionButton title="+  Thêm người dùng" onPress={() => navigation.navigate("UserForm")} />
        {error ? <Notice text={error} /> : null}
        {loading ? <Loading /> : users.map((user) => <View style={styles.userRow} key={user.id}>
            <View style={styles.userAvatar}><Text>👤</Text></View>
            <View style={styles.userRowInfo}>
                <Text style={styles.productName}>{user.name}</Text>
                <Text style={styles.cardMeta}>{user.email}</Text>
                <Text style={styles.userRole}>{user.role === "admin" ? "Quản trị viên" : "Người dùng"}</Text>
            </View>
            <View style={styles.userActions}>
                <Pressable onPress={() => navigation.navigate("UserForm", { user })}><Text style={styles.smallEditText}>Sửa</Text></Pressable>
                <Pressable onPress={() => deleteUser(user)}><Text style={styles.smallDeleteText}>Xóa</Text></Pressable>
            </View>
        </View>)}
        {!loading && users.length === 0 && !error ? <Text style={styles.emptyText}>Chưa có người dùng.</Text> : null}
    </Screen>;
}

function UserFormScreen() {
    const navigation = useNavigation<AppNavigation>();
    const route = useRoute<RouteProp<RootStackParamList, "UserForm">>();
    const current = route.params?.user;
    const [name, setName] = useState(current?.name || "");
    const [email, setEmail] = useState(current?.email || "");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<User["role"]>(current?.role || "user");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function save() {
        if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Vui lòng nhập họ tên và email hợp lệ.");
            return;
        }
        if ((!current || password) && password.length < 6) {
            setError("Mật khẩu cần có ít nhất 6 ký tự.");
            return;
        }
        setSaving(true);
        setError("");
        const payload: { name: string; email: string; password?: string; role: User["role"] } = {
            name: name.trim(),
            email: email.trim(),
            role,
        };
        if (password) payload.password = password;
        try {
            await api(current ? `/users/${current.id}` : "/users", {
                method: current ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });
            navigation.goBack();
        } catch (requestError) {
            setError(messageOf(requestError));
        } finally {
            setSaving(false);
        }
    }

    return <Screen>
        <Title>{current ? "Cập nhật người dùng" : "Thêm người dùng"}</Title>
        {error ? <Notice text={error} /> : null}
        <Field label="Họ tên" value={name} onChangeText={setName} placeholder="Họ và tên" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="name@example.com" />
        <Field label={current ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu (ít nhất 6 ký tự)"}
            value={password} onChangeText={setPassword} secureTextEntry placeholder="Mật khẩu" />
        <Text style={styles.fieldLabel}>Vai trò</Text>
        <View style={styles.roleRow}>
            <Pressable style={[styles.filterChip, role === "user" && styles.filterChipActive]} onPress={() => setRole("user")}>
                <Text style={[styles.filterText, role === "user" && styles.filterTextActive]}>Người dùng</Text>
            </Pressable>
            <Pressable style={[styles.filterChip, role === "admin" && styles.filterChipActive]} onPress={() => setRole("admin")}>
                <Text style={[styles.filterText, role === "admin" && styles.filterTextActive]}>Quản trị viên</Text>
            </Pressable>
        </View>
        <ActionButton title={saving ? "Đang lưu..." : "Lưu người dùng"} disabled={saving} onPress={() => void save()} />
    </Screen>;
}

function Loading() {
    return <View style={styles.loading}><ActivityIndicator color={colors.purple} /><Text style={styles.muted}>Đang tải...</Text></View>;
}

function TabBarIcon({ icon, focused, color }: { icon: string; focused: boolean; color: string }) {
    return <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
        <Text style={[styles.tabIcon, { color }]}>{icon}</Text>
    </View>;
}

function StoreTabs() {
    const { user } = useAuth();
    return <Tabs.Navigator screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: "#9690a2",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
    }}>
        <Tabs.Screen name="Home" component={HomeScreen} options={{ title: "Trang chủ", tabBarIcon: ({ focused, color }) => <TabBarIcon icon="⌂" focused={focused} color={color} /> }} />
        <Tabs.Screen name="Products" component={ProductsScreen} options={{ title: "Sản phẩm", tabBarIcon: ({ focused, color }) => <TabBarIcon icon="▦" focused={focused} color={color} /> }} />
        <Tabs.Screen name="Cart" component={CartScreen} options={{ title: "Giỏ hàng", tabBarIcon: ({ focused, color }) => <TabBarIcon icon="🛍" focused={focused} color={color} /> }} />
        <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Cá nhân", tabBarIcon: ({ focused, color }) => <TabBarIcon icon="♙" focused={focused} color={color} /> }} />
        {user?.role === "admin" ? (
            <Tabs.Screen name="Admin" component={AdminScreen} options={{ title: "Quản trị", tabBarIcon: ({ focused, color }) => <TabBarIcon icon="⚙" focused={focused} color={color} /> }} />
        ) : null}
    </Tabs.Navigator>;
}

function RootNavigator() {
    const { ready } = useAuth();
    if (!ready) return <SafeAreaView style={styles.splash}><Loading /></SafeAreaView>;
    return <NavigationContainer>
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.background },
        }}>
            <Stack.Screen name="Store" component={StoreTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Đăng nhập" }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Đăng ký" }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Chi tiết sản phẩm" }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: "Quản trị cửa hàng" }} />
            <Stack.Screen name="AdminProducts" component={AdminProductsScreen} options={{ title: "Quản lý sản phẩm" }} />
            <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: "Thông tin sản phẩm" }} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: "Quản lý người dùng" }} />
            <Stack.Screen name="UserForm" component={UserFormScreen} options={{ title: "Thông tin người dùng" }} />
        </Stack.Navigator>
    </NavigationContainer>;
}

export default function App() {
    return <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider><RootNavigator /></AuthProvider>
    </SafeAreaProvider>;
}

const colors = {
    background: "#faf8ff",
    white: "#ffffff",
    purple: "#8060c0",
    purpleDark: "#594184",
    purpleLight: "#eee7ff",
    ink: "#30293b",
    muted: "#81798c",
    border: "#eee8f7",
    red: "#a83232",
    green: "#246b3b",
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { padding: 18, paddingBottom: 34 },
    titleBlock: { marginBottom: 20 },
    pageTitle: { color: colors.purpleDark, fontSize: 27, fontWeight: "800" },
    subtitle: { color: colors.muted, fontSize: 14, marginTop: 5, lineHeight: 20 },
    homeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
    greeting: { color: colors.muted, fontSize: 13 },
    brandTitle: { color: colors.purpleDark, fontSize: 24, fontWeight: "800", marginTop: 2 },
    avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.purpleLight },
    avatarText: { fontSize: 22 },
    searchBar: { height: 48, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginBottom: 20 },
    searchIcon: { color: colors.purple, fontSize: 25, marginRight: 8 },
    searchInput: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 8 },
    searchGo: { color: colors.purple, fontWeight: "700", padding: 5 },
    banner: { position: "relative", overflow: "hidden", backgroundColor: "#eee7ff", borderRadius: 22, padding: 20, marginBottom: 26 },
    bannerKicker: { color: colors.purple, fontWeight: "700", fontSize: 10, letterSpacing: 0.6 },
    bannerTitle: { color: colors.purpleDark, fontSize: 29, lineHeight: 34, fontWeight: "800", marginVertical: 10 },
    bannerDecor: { position: "absolute", right: 16, top: 40, fontSize: 60 },
    button: { backgroundColor: colors.purple, borderRadius: 11, paddingHorizontal: 16, paddingVertical: 13, alignItems: "center", justifyContent: "center", marginTop: 9, minHeight: 46 },
    buttonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
    secondaryButton: { backgroundColor: colors.white, borderWidth: 1, borderColor: "#ddd2f2" },
    secondaryButtonText: { color: colors.purpleDark },
    disabledButton: { opacity: 0.55 },
    pressed: { opacity: 0.82 },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13, marginTop: 3 },
    sectionTitle: { color: colors.purpleDark, fontSize: 17, fontWeight: "800" },
    sectionAction: { color: colors.purple, fontSize: 13, fontWeight: "700" },
    categoryRow: { gap: 10, paddingBottom: 24 },
    categoryChip: { width: 82, minHeight: 92, borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", padding: 8 },
    categoryIcon: { fontSize: 25, marginBottom: 5 },
    categoryName: { color: colors.muted, fontSize: 10, textAlign: "center" },
    productGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
    gridItem: { width: "50%", paddingHorizontal: 6, marginBottom: 12 },
    productCard: { borderRadius: 15, overflow: "hidden", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
    productImage: { width: "100%", height: 132, backgroundColor: "#f1ebfb" },
    imagePlaceholder: { justifyContent: "center", alignItems: "center" },
    placeholderIcon: { fontSize: 42 },
    cartPlaceholderIcon: { fontSize: 32 },
    placeholderIconLarge: { fontSize: 75 },
    productCardBody: { padding: 10 },
    productName: { color: colors.ink, fontWeight: "700", fontSize: 13, lineHeight: 18 },
    productPrice: { color: colors.purple, fontWeight: "800", fontSize: 14, marginTop: 5 },
    cardMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
    filterRow: { gap: 8, paddingBottom: 16 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, marginRight: 7 },
    filterChipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
    filterText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
    filterTextActive: { color: colors.white },
    detailImage: { width: "100%", height: 270, borderRadius: 20, backgroundColor: "#f1ebfb" },
    detailBody: { paddingTop: 20 },
    detailCategory: { color: colors.purple, fontSize: 12, fontWeight: "700" },
    detailTitle: { color: colors.purpleDark, fontSize: 24, fontWeight: "800", marginTop: 5 },
    detailPrice: { color: colors.purple, fontSize: 23, fontWeight: "800", marginTop: 10 },
    detailDescription: { color: "#625b6e", fontSize: 14, lineHeight: 22, marginTop: 15 },
    stockText: { color: colors.muted, marginTop: 10 },
    quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 18 },
    quantityControl: { flexDirection: "row", alignItems: "center", gap: 10 },
    quantityButton: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.purpleLight, alignItems: "center", justifyContent: "center" },
    quantityButtonText: { color: colors.purpleDark, fontWeight: "800", fontSize: 18 },
    quantityValue: { minWidth: 18, textAlign: "center", color: colors.ink, fontWeight: "700" },
    notice: { borderRadius: 10, padding: 12, marginVertical: 8 },
    errorNotice: { backgroundColor: "#fff0f0" },
    successNotice: { backgroundColor: "#edfff2" },
    errorText: { color: colors.red, fontSize: 13, lineHeight: 19 },
    successText: { color: colors.green, fontSize: 13, lineHeight: 19 },
    emptyCard: { backgroundColor: colors.white, borderRadius: 18, padding: 22, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    emptyIcon: { fontSize: 44, marginBottom: 9 },
    emptyText: { color: colors.muted, textAlign: "center", lineHeight: 21, marginBottom: 8, padding: 20 },
    cartImage: { width: 92, height: 104, borderRadius: 12, backgroundColor: "#f1ebfb" },
    cartCard: { flexDirection: "row", backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 11, marginBottom: 12, shadowColor: "#38264f", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
    cartDetails: { flex: 1, marginLeft: 12, justifyContent: "center" },
    cartItemHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 5 },
    cartItemName: { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 14, lineHeight: 19 },
    cartRemoveButton: { width: 27, height: 27, borderRadius: 14, backgroundColor: "#fff2f2", alignItems: "center", justifyContent: "center" },
    cartRemoveIcon: { color: colors.red, fontSize: 22, lineHeight: 24, fontWeight: "500" },
    cartBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, marginTop: 11 },
    cartLineTotal: { color: colors.purpleDark, fontSize: 12, fontWeight: "800" },
    totalCard: { backgroundColor: colors.white, borderRadius: 18, padding: 17, borderWidth: 1, borderColor: colors.border, marginTop: 3 },
    totalHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    totalLabel: { color: colors.ink, fontWeight: "700" },
    totalPrice: { color: colors.purple, fontWeight: "800", fontSize: 17 },
    totalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    totalHint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
    profileCard: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 20 },
    profileAvatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", alignSelf: "center", backgroundColor: colors.purpleLight, marginBottom: 18 },
    profileAvatarText: { fontSize: 39 },
    profileLine: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    profileLineLabel: { color: colors.muted, fontSize: 12 },
    profileLineValue: { color: colors.ink, fontSize: 15, fontWeight: "700", marginTop: 4 },
    field: { marginBottom: 15 },
    fieldLabel: { color: "#544b62", fontWeight: "700", fontSize: 13, marginBottom: 7 },
    input: { minHeight: 47, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: "#dfd6ec", paddingHorizontal: 13, paddingVertical: 11, color: colors.ink, fontSize: 14 },
    multilineInput: { minHeight: 100, textAlignVertical: "top" },
    authScreen: { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 42 },
    authEyebrow: { color: colors.purple, fontWeight: "800", letterSpacing: 2, fontSize: 12, marginBottom: 8 },
    authTitle: { color: colors.purpleDark, fontSize: 29, fontWeight: "800" },
    loginRolePicker: { flexDirection: "row", gap: 6, padding: 5, borderRadius: 12, backgroundColor: "#f4f0fb", marginTop: 20, marginBottom: 15 },
    loginRoleOption: { flex: 1, alignItems: "center", paddingVertical: 11, paddingHorizontal: 7, borderRadius: 9 },
    loginRoleOptionSelected: { backgroundColor: colors.white, elevation: 2 },
    loginRoleText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
    loginRoleTextSelected: { color: colors.purpleDark, fontWeight: "800" },
    authLinkRow: { flexDirection: "row", justifyContent: "center", padding: 18 },
    authLinkMuted: { color: colors.muted, fontSize: 13 },
    authLink: { color: colors.purple, fontWeight: "800", fontSize: 13 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
    statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 11, alignItems: "center" },
    statIcon: { fontSize: 21 },
    statValue: { color: colors.purpleDark, fontWeight: "800", fontSize: 18, marginTop: 4 },
    statLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
    adminMenuButton: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 17, marginBottom: 11 },
    adminMenuText: { flex: 1 },
    adminMenuTitle: { color: colors.purpleDark, fontWeight: "800", fontSize: 15 },
    adminMenuSubtitle: { color: colors.muted, fontSize: 12, marginTop: 5 },
    chevron: { color: colors.purple, fontSize: 28, marginLeft: 8 },
    adminRow: { flexDirection: "row", backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginTop: 12 },
    adminRowInfo: { flex: 1, padding: 11, justifyContent: "center" },
    adminActions: { flexDirection: "row", gap: 10, marginTop: 8 },
    smallEditButton: { backgroundColor: colors.purpleLight, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 6 },
    smallEditText: { color: colors.purpleDark, fontSize: 12, fontWeight: "700" },
    smallDeleteButton: { backgroundColor: "#fff0f0", borderRadius: 7, paddingHorizontal: 12, paddingVertical: 6 },
    smallDeleteText: { color: colors.red, fontSize: 12, fontWeight: "700" },
    userRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 10 },
    userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purpleLight, alignItems: "center", justifyContent: "center" },
    userRowInfo: { flex: 1, marginHorizontal: 10 },
    userRole: { color: colors.purple, fontSize: 10, fontWeight: "700", marginTop: 4 },
    userActions: { gap: 11, alignItems: "center" },
    roleRow: { flexDirection: "row", marginBottom: 12 },
    loading: { padding: 28, alignItems: "center", gap: 10 },
    muted: { color: colors.muted, paddingVertical: 8, fontSize: 13 },
    tabBar: { backgroundColor: colors.white, borderTopColor: colors.border, borderTopWidth: 1, height: 72, paddingTop: 7, paddingBottom: 8, elevation: 14, shadowColor: "#38264f", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
    tabItem: { paddingTop: 1 },
    tabLabel: { fontSize: 10, fontWeight: "700", marginTop: 1 },
    tabIconWrap: { width: 42, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    tabIconWrapActive: { backgroundColor: colors.purpleLight },
    tabIcon: { fontSize: 19, fontWeight: "700" },
    splash: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
});
