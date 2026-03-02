import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import DictionarySearch from "./pages/DictionarySearch";
import StudySession from "./pages/StudySession";
import AuthPage from "./pages/AuthPage";
import DecksPage from "./pages/DecksPage";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
            retry: 1,
        },
    },
});

/** Route guard — renders children if authenticated, redirects to /auth otherwise. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route
                path="/auth"
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
                }
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <DictionarySearch />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/decks"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <DecksPage />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/study/:deckId"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <StudySession />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}
