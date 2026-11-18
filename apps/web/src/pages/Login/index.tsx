import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@zenner/core/store/index';
import { Button, Input, Label } from '@zenner/ui';
import { useLoginForm } from './hooks/useLoginForm';

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

export function Login() {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const {
    username,
    setUsername,
    password,
    setPassword,
    errorMsg,
    handleSubmit
  } = useLoginForm();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Top-right controls: Language + Theme toggle */}
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
        {/* Left column: Slogan + Logo + Background (Visible on lg and up) */}
        <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 bg-muted/30 overflow-hidden">
          {/* Background Image overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-20 pointer-events-none grayscale"
            style={{ backgroundImage: `url(${backgroundSvg})` }}
          />
          {/* Subtle gradient overlay to make it look extremely premium */}
          <div className="absolute inset-0 bg-gradient-to-tr from-foreground/5 via-transparent to-background/20 pointer-events-none" />

          {/* Logo area */}
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

          {/* Slogan and details */}
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

          {/* Footer of left panel */}
          <div className="relative z-10 font-sans text-xs text-muted-foreground">
            © {new Date().getFullYear()} Zenner. All rights reserved.
          </div>
        </div>

        {/* Right column: Login Panel */}
        <div className="col-span-1 lg:col-span-3 flex flex-col justify-center items-center p-8 lg:p-12 bg-background relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Small header for mobile when left side is hidden */}
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
              <h1 className="text-3xl font-bold font-sans tracking-tight">{t('auth.login')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('common.welcome')}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">{t('auth.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  placeholder={t('auth.usernamePlaceholder')}
                  autoComplete="username"
                  required
                  className="h-11"
                  tabIndex={1}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline font-medium"
                    tabIndex={4}
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="h-11"
                  tabIndex={2}
                />
              </div>

              <Button type="submit" className="w-full mt-2 font-semibold h-11" size="lg" tabIndex={3}>
                {t('auth.login')}
              </Button>
            </form>

            <div className="relative flex py-2 items-center text-muted-foreground">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground/60">{t('auth.or')}</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Google Login button */}
            <Button 
              variant="outline" 
              type="button" 
              className="w-full h-11 font-medium flex items-center justify-center gap-2 border-border hover:bg-muted/50"
              tabIndex={5}
            >
              <svg className="h-5 w-5 grayscale" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.847-6.357-6.357s2.847-6.357 6.357-6.357c1.622 0 3.097.618 4.223 1.63L21.29 4.36C19.123 2.274 16.037 1 12.24 1 5.864 1 .7 6.164.7 12.54S5.864 24.08 12.24 24.08c6.165 0 11.233-5.068 11.233-11.233 0-.84-.11-1.63-.3-2.562H12.24Z"
                />
              </svg>
              {t('auth.loginWithGoogle')}
            </Button>

            {/* Register button / redirect hint */}
            <p className="text-center text-sm text-muted-foreground pt-2">
              {t('auth.dontHaveAccount')}{' '}
              <Link 
                to="/register" 
                className="text-foreground hover:underline font-bold"
                tabIndex={6}
              >
                {t('auth.signup')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
