import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@zenner/core/store/index';

export function useLoginForm() {
	const { t } = useTranslation();
	const login = useAuthStore((state) => state.login);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMsg, setErrorMsg] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMsg('');

		if (username === 'admin' && password === '123456789012') {
			login('mock_token_123');
		} else {
			setErrorMsg(t('auth.invalidCredentials'));
		}
	};

	return {
		username,
		setUsername,
		password,
		setPassword,
		errorMsg,
		setErrorMsg,
		handleSubmit,
	};
}
