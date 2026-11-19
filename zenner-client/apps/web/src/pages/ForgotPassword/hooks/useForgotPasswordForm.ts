import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg(t('auth.emailRequired', { defaultValue: 'Vui lòng nhập email.' }));
      return;
    }

    // Mock API call to send reset password link
    setSuccessMsg(t('auth.resetLinkSentSuccess', { defaultValue: 'Một liên kết khôi phục mật khẩu đã được gửi đến email của bạn.' }));
  };

  return {
    email,
    setEmail,
    errorMsg,
    successMsg,
    handleSubmit,
  };
}
