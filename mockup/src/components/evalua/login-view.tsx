'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginView() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background:
          'linear-gradient(145deg, #f3f4f6 0%, #fef5e7 50%, #f3f4f6 100%)',
      }}
    >
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #394049 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Card
          className="border-gray-200/60 shadow-xl"
          style={{ backgroundColor: '#fffefd' }}
        >
          <CardHeader className="items-center pb-2">
            {/* Logo circle */}
            <motion.div
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
              style={{ backgroundColor: '#EA7600' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: 'spring',
                stiffness: 220,
                damping: 14,
              }}
            >
              <span className="text-3xl font-bold text-white select-none">E</span>
            </motion.div>

            <motion.h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--evalua-dark)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              EvalUA
            </motion.h1>
            <motion.p
              className="text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              Consola de Administración
            </motion.p>
          </CardHeader>

          <CardContent className="pt-2">
            <motion.form
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              onSubmit={(e) => e.preventDefault()}
            >
              {/* Email field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  style={{ color: 'var(--evalua-dark)' }}
                >
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@evalua.cl"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  style={{ color: 'var(--evalua-dark)' }}
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: '#EA7600' }}
              >
                Iniciar Sesión
              </Button>

              {/* Forgot password */}
              <p className="text-center text-sm text-gray-400">
                <button
                  type="button"
                  className="hover:underline cursor-pointer"
                  style={{ color: 'var(--evalua-primary)' }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </motion.form>
          </CardContent>
        </Card>

        {/* Bottom text */}
        <motion.p
          className="mt-6 text-center text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          &copy; {new Date().getFullYear()} EvalUA
        </motion.p>
      </motion.div>
    </div>
  )
}
