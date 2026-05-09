'use client';

import { useSearchParams } from 'next/navigation';
import { login } from './actions';
import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const errorMessages: Record<string, string> = {
    invalid: 'Credenciales incorrectas',
    missing: 'Complete todos los campos',
    network: 'Error de conexión con el servidor',
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: 'var(--ps-bg)' }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-[0.03]"
          style={{ background: 'var(--ps-gold)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-[0.02]"
          style={{ background: 'var(--ps-gold)' }}
        />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: 'var(--ps-surface)',
            border: '1px solid var(--ps-border)',
            color: 'var(--ps-gold)',
          }}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-persenso p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative gold line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--ps-gold)] to-transparent opacity-50" />

          <div className="text-center mb-10">
            <h1
              className="font-display text-4xl mb-2 font-semibold"
              style={{ color: 'var(--ps-gold)' }}
            >
              PerSenso
            </h1>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--ps-text-muted)' }}
            >
              Portal Administrativo
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg text-sm text-center"
              style={{
                background: 'rgba(224, 92, 92, 0.12)',
                color: 'var(--ps-red)',
                border: '1px solid rgba(224, 92, 92, 0.2)',
              }}
            >
              {errorMessages[error] || 'Error desconocido'}
            </motion.div>
          )}

          <form
            action={async (formData) => {
              setLoading(true);
              try {
                await login(formData);
              } catch {
                setLoading(false);
              }
            }}
            className="space-y-6"
          >
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-widest mb-2 block"
                style={{ color: 'var(--ps-text-muted)' }}
              >
                Usuario
              </label>
              <input
                name="username"
                type="text"
                required
                placeholder="Ingrese su usuario"
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none focus:ring-1"
                style={{
                  background: 'var(--ps-input-bg)',
                  border: '1px solid var(--ps-input-border)',
                  color: 'var(--ps-input-text)',
                }}
              />
            </div>

            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-widest mb-2 block"
                style={{ color: 'var(--ps-text-muted)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-lg transition-all duration-200 outline-none focus:ring-1"
                  style={{
                    background: 'var(--ps-input-bg)',
                    border: '1px solid var(--ps-input-border)',
                    color: 'var(--ps-input-text)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--ps-text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 text-sm font-bold uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 10px 20px -5px rgba(201, 168, 76, 0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Validando...
                </span>
              ) : (
                'INGRESAR AL PANEL'
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p
              className="text-[9px] uppercase tracking-widest"
              style={{ color: 'var(--ps-text-muted)' }}
            >
              © 2025 PerSenso Scent Flow
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
