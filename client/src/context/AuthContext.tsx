import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { auth, setToken, clearToken, getToken } from "../lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/api";

interface AuthContextValue {
    user: AuthResponse | null;
    isAuthenticated: boolean;
    login: (creds: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Rehydrate user from a stored JWT payload (base64 decode claims only — no verification). */
function parseUserFromToken(token: string): AuthResponse | null {
    try {
        const [, payload] = token.split(".");
        const decoded = JSON.parse(atob(payload));
        // JWT subject is the email — we only have minimal info without a /me endpoint
        return { token, id: "", username: "", email: decoded.sub ?? "" };
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthResponse | null>(() => {
        const stored = getToken();
        return stored ? parseUserFromToken(stored) : null;
    });

    const login = useCallback(async (creds: LoginRequest) => {
        const res = await auth.login(creds);
        setToken(res.token);
        setUser(res);
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        const res = await auth.register(data);
        setToken(res.token);
        setUser(res);
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isAuthenticated: !!user, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
