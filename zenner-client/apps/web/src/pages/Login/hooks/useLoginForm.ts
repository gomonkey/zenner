import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@zenner/core/store/index';
import { authApi } from '@zenner/core/api/endpoints/auth.api';

export function useLoginForm() {
	const { t } = useTranslation();
	const login = useAuthStore((state) => state.login);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMsg('');
		setIsLoading(true);

		try {
			const response = await authApi.login({
				email: username,
				password,
			});
			login(response.accessToken);
		} catch (error: any) {
			const message =
				error?.response?.data?.detail ||
				error?.response?.data?.message ||
				t('auth.invalidCredentials');
			setErrorMsg(message);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		username,
		setUsername,
		password,
		setPassword,
		errorMsg,
		setErrorMsg,
		isLoading,
		handleSubmit,
	};
}
