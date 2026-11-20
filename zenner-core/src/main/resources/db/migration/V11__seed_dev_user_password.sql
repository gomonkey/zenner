-- Seed password for default development user (password: password123)
UPDATE users
SET password_hash = '$2a$10$DkpIfDt5QmNKF0LOPdlJaOSI9oGMXdXS14ut4MNrqszIpg5Wm5FUS',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '00000000-0000-0000-0000-000000000001'
   OR email = 'dev@zenner.local';
