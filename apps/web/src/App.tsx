import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@zenner/core/store/index';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

export function App() {
	const { isAuthenticated, isInitializing, checkAuth } = useAuthStore();
	const { theme, setTheme } = useThemeStore();

	// Initialize & sync theme on mount
	useEffect(() => {
		// Apply stored/default theme on startup
		setTheme(theme);

		// Listen for OS dark mode changes when using 'system' preference
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			if (useThemeStore.getState().theme === 'system') {
				setTheme('system');
			}
		};
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	if (isInitializing) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-background">
				<div className="animate-pulse text-center">
					<h1 className="font-sans text-5xl font-extrabold text-foreground mb-2">
						Zenner
					</h1>
					<p className="text-muted-foreground text-xs font-semibold tracking-widest">
						LOADING...
					</p>
				</div>
			</div>
		);
	}

	return (
		<Routes>
			<Route
				path="/login"
				element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
			/>
			<Route
				path="/register"
				element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />}
			/>
			<Route
				path="/forgot-password"
				element={
					!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" replace />
				}
			/>
			<Route
				path="/"
				element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
