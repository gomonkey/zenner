import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@zenner/core/store/index';

export function useRegisterForm() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch', { defaultValue: 'Mật khẩu xác nhận không khớp.' }));
      return;
    }

    // Mock registration API call success
    setSuccessMsg(t('auth.registerSuccess', { defaultValue: 'Đăng ký thành công! Đang tự động đăng nhập...' }));
    
    setTimeout(() => {
      login('mock_token_register_123');
    }, 1500);
  };

  return {
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    errorMsg,
    successMsg,
    handleSubmit,
  };
}
