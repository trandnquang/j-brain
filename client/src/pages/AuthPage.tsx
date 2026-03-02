import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { ApiError } from "../types/api";

type Mode = "login" | "register";

export default function AuthPage() {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<Mode>("login");
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === "login") {
                await login({ email: form.email, password: form.password });
            } else {
                await register({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                });
            }
        } catch (err) {
            const apiErr = err as ApiError;
            setError(
                apiErr?.message ?? "Something went wrong. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    const field = (
        name: keyof typeof form,
        placeholder: string,
        type = "text",
    ) => (
        <div>
            <Input
                id={name}
                type={type}
                placeholder={placeholder}
                value={form[name]}
                onChange={(e) =>
                    setForm((f) => ({ ...f, [name]: e.target.value }))
                }
                required
                className="h-11"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        J-Brain
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {mode === "login"
                            ? "Sign in to your account"
                            : "Create a new account"}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === "register" && field("username", "Username")}
                    {field("email", "Email address", "email")}
                    {field("password", "Password", "password")}

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 bg-black hover:bg-gray-800 text-white font-medium"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : mode === "login" ? (
                            "Sign in"
                        ) : (
                            "Create account"
                        )}
                    </Button>
                </form>

                {/* Toggle */}
                <p className="text-center text-sm text-gray-500">
                    {mode === "login"
                        ? "Don't have an account?"
                        : "Already have an account?"}{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === "login" ? "register" : "login");
                            setError(null);
                        }}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                </p>
            </div>
        </div>
    );
}
