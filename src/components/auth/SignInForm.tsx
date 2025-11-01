"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import CryptoJS from 'crypto-js';
import { AuthApi } from "@/app/api/AuthApi";
import Image from "next/image";
import { useTranslation } from 'react-i18next';

const ENCRYPTION_KEY = 'JFb5K2Q0W6yPzRbNQrYpHbJ9RncgBnV8c1NxajY5Fsk=';

export default function SignInForm() {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();

  // Load saved credentials on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('saved_username');
    const savedPassword = localStorage.getItem('saved_password');

    if (savedUsername && savedPassword) {
      try {
        const decryptedUsername = CryptoJS.AES.decrypt(savedUsername, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
        const decryptedPassword = CryptoJS.AES.decrypt(savedPassword, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);

        if (decryptedUsername && decryptedPassword) {
          setUsername(decryptedUsername);
          setPassword(decryptedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Failed to decrypt saved credentials:', error);
        // Clear invalid saved credentials
        localStorage.removeItem('saved_username');
        localStorage.removeItem('saved_password');
      }
    }
  }, []);

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const user = { username, password };
      const response = await AuthApi.login(user);
      const { access_token, refresh_token, expires_in } = response;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('expires_in', String(Date.now() + expires_in * 1000));
      localStorage.setItem('isLoggedIn', 'true');

      if (rememberMe) {
        const encryptedUsername = CryptoJS.AES.encrypt(username, ENCRYPTION_KEY).toString();
        const encryptedPassword = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
        localStorage.setItem('saved_username', encryptedUsername);
        localStorage.setItem('saved_password', encryptedPassword);
      } else {
        localStorage.removeItem('saved_username');
        localStorage.removeItem('saved_password');
      }

      router.push('/');
    } catch (error: any) {
      setErrorMessage(t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full items-center">
        <div className="flex items-center pt-5">
          <Image
              width={600}
              height={200}
              src="/images/logo/auth-logo.webp"
              alt={t('logo_alt')}
          />
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                {t('sign_in')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('enter_credentials')}
              </p>
            </div>
            <div>
              <div className="relative py-3 sm:py-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
              </div>
              {errorMessage && (
                  <p className="text-center text-red-500 animate-pulse">
                    {errorMessage}
                  </p>
              )}
              <form onSubmit={handleLogin}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      {t('telephone')} <span className="text-error-500">*</span>
                    </Label>
                    <Input
                        placeholder={t('your_telephone')}
                        defaultValue={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>
                      {t('password')} <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={t('enter_password')}
                          defaultValue={password}
                          onChange={(e) => setPassword(e.target.value)}
                      />
                      <span
                          onClick={() => setShowPassword(!showPassword)}
                          className={
                              "absolute z-30 -translate-y-1/2 cursor-pointer top-1/2 " +
                              (i18n.dir() === "rtl" ? "left-4" : "right-4")
                          }
                      >
                      {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400"/>
                      ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400"/>
                      )}
                    </span>
                    </div>
                  </div>
                  <div>
                    {loading ? (
                        <div className="flex justify-center">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                        </div>
                    ) : (
                        <Button className="w-full" size="sm">
                          {t('sign_in')}
                        </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  );
}
