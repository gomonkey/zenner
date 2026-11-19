import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@zenner/core/store/index';
import { Button, Input, Label } from '@zenner/ui';
import { useForgotPasswordForm } from './hooks/useForgotPasswordForm';

// Import assets from alias
import logoBlue from '@zenner/assets/icons/zenner-logo-blue.svg';
import logoLight from '@zenner/assets/icons/zenner-logo-light.svg';
import backgroundSvg from '@zenner/assets/images/background.svg';

// Inline SVG icons to avoid additional dependencies
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}

export function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const {
    email,
    setEmail,
    errorMsg,
    successMsg,
    handleSubmit,
  } = useForgotPasswordForm();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="text-xs text-muted-foreground hover:text-foreground font-medium"
          aria-label="Toggle language"
        >
          {i18n.language === 'vi' ? 'EN' : 'VI'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground w-8 h-8 p-0"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 w-full">
        {/* Left column: Slogan + Logo + Background */}
        <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 bg-muted/30 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-20 pointer-events-none grayscale"
            style={{ backgroundImage: `url(${backgroundSvg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-foreground/5 via-transparent to-background/20 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3">
            <img 
              src={resolvedTheme === 'dark' ? logoLight : logoBlue} 
              alt="Zenner Logo" 
              className="h-10 w-10 rounded-xl object-cover shadow-sm border border-border grayscale contrast-125"
            />
            <span className="font-sans text-2xl font-extrabold tracking-tight text-foreground">
              Zenner
            </span>
          </div>

          <div className="relative z-10 my-auto max-w-xl space-y-6">
            <h1 className="font-sans text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              {t('common.welcome')}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
              {t('common.slogan')}
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="h-0.5 w-10 bg-foreground" />
              <span className="font-sans text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Focus & Productivity
              </span>
            </div>
          </div>

          <div className="relative z-10 font-sans text-xs text-muted-foreground">
            © {new Date().getFullYear()} Zenner. All rights reserved.
          </div>
        </div>

        {/* Right column: ForgotPassword Panel */}
        <div className="col-span-1 lg:col-span-3 flex flex-col justify-center items-center p-8 lg:p-12 bg-background relative z-10">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden flex flex-col items-center text-center space-y-2 mb-6">
              <img 
                src={resolvedTheme === 'dark' ? logoLight : logoBlue} 
                alt="Zenner Logo" 
                className="h-14 w-14 rounded-2xl shadow-md border border-border mb-2 grayscale contrast-125"
              />
              <h2 className="font-sans text-3xl font-extrabold text-foreground">
                Zenner
              </h2>
              <p className="text-muted-foreground text-sm font-medium">
                {t('common.slogan')}
              </p>
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-3xl font-bold font-sans tracking-tight">{t('auth.forgotPassword')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('auth.forgotPasswordDescription')}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-200">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 text-sm text-foreground bg-muted rounded-lg font-sans font-medium border border-border animate-in fade-in slide-in-from-top-1 duration-200">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="h-11"
                  tabIndex={1}
                />
              </div>

              <Button type="submit" className="w-full mt-2 font-semibold h-11" size="lg" tabIndex={2}>
                {t('auth.sendResetLink')}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-2">
              <Link 
                to="/login" 
                className="text-foreground hover:underline font-bold"
                tabIndex={3}
              >
                {t('auth.backToLogin')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
