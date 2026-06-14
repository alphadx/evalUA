'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  MousePointerClick,
  AlertTriangle,
  Save,
  Zap,
  GitBranch,
  ArrowRight,
  Server,
  Lock,
  Layout,
  Database,
  Globe,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/* ── Animation helpers ───────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: 'easeOut' },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
}

/* ── Feature definitions ─────────────────────────────────────── */

const features = [
  {
    icon: Shield,
    title: 'Zero-Knowledge Privacy',
    desc: 'No se almacena ningún dato personal del estudiante. La evaluación es anónima y segura por diseño.',
    accent: '#EA7600',
  },
  {
    icon: MousePointerClick,
    title: 'Wizard Interactivo',
    desc: 'Flujo guiado paso a paso para evaluar cada criterio con descriptores claros y observaciones.',
    accent: '#9DD4D3',
  },
  {
    icon: AlertTriangle,
    title: 'Gatekeeper',
    desc: 'Regla de exclusión automática: si un criterio excluyente reprobado, la nota final es 1.0.',
    accent: '#C8102E',
  },
  {
    icon: Save,
    title: 'Auto-save',
    desc: 'Borradores guardados automáticamente en Redis cada 30 segundos. Nunca pierdes tu progreso.',
    accent: '#198754',
  },
  {
    icon: Zap,
    title: 'Caché L2 Redis',
    desc: 'Rúbricas y descriptores en caché con hit latency < 5 ms. Respuesta instantánea.',
    accent: '#EA7600',
  },
  {
    icon: GitBranch,
    title: 'Versión Inmutable',
    desc: 'Cada rúbrica tiene versionado inmutable. Las evaluaciones referencian una versión específica.',
    accent: '#394049',
  },
]

/* ── Architecture flow nodes ─────────────────────────────────── */

const archNodes = [
  { label: 'Host (LMS)', icon: Globe, color: '#394049' },
  { label: 'JWT', icon: Lock, color: '#EA7600' },
  { label: 'EvalUA Iframe', icon: Layout, color: '#EA7600' },
  { label: 'Redis', icon: Zap, color: '#C8102E' },
  { label: 'MongoDB', icon: Database, color: '#198754' },
]

/* ── Tech badges ─────────────────────────────────────────────── */

const techBadges = [
  { label: 'Next.js 16', color: '#394049' },
  { label: 'TypeScript', color: '#3178C6' },
  { label: 'MongoDB', color: '#47A248' },
  { label: 'Redis', color: '#DC382D' },
  { label: 'Docker', color: '#2496ED' },
  { label: 'DDD', color: '#EA7600' },
  { label: 'JWT', color: '#C8102E' },
  { label: 'Zustand', color: '#54412E' },
]

/* ── Component ───────────────────────────────────────────────── */

export default function OverviewView() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:py-28"
        style={{
          background:
            'linear-gradient(135deg, #EA7600 0%, #c46200 50%, #9e4e00 100%)',
        }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-10"
          style={{ backgroundColor: '#fff' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full opacity-10"
          style={{ backgroundColor: '#fff' }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <span className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-white/90 backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              Sistema de Evaluación Curricular
            </span>
          </motion.div>

          <motion.h1
            className="mt-4 text-5xl font-extrabold tracking-tight text-white sm:text-7xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            EvalUA{' '}
            <span className="text-white/70">v3.0</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-4 max-w-2xl text-lg sm:text-xl text-white/85"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          >
            Sistema de Evaluación Curricular por Rúbricas
          </motion.p>

          <motion.p
            className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-white/65"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
          >
            Micro-frontend autocontenido que permite evaluar proyectos curriculares
            mediante rúbricas estructuradas, con privacidad zero-knowledge, reglas
            Gatekeeper de exclusión automática y caché L2 en Redis.
          </motion.p>
        </div>
      </section>

      {/* ─── Feature Cards ─────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20" style={{ backgroundColor: '#f9fafb' }}>
        <motion.div
          className="mx-auto max-w-6xl"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.h2
            className="mb-2 text-center text-3xl font-bold"
            style={{ color: 'var(--evalua-dark)' }}
            variants={fadeUp}
            custom={0}
          >
            Características Principales
          </motion.h2>
          <motion.p
            className="mb-10 text-center text-sm text-gray-500"
            variants={fadeUp}
            custom={1}
          >
            Diseñado para la rigurosidad académica con la mejor experiencia de usuario
          </motion.p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={f.title} variants={fadeUp} custom={i + 2}>
                  <Card
                    className="group h-full transition-shadow duration-300 hover:shadow-lg border-gray-200/80"
                    style={{ backgroundColor: 'var(--evalua-card)' }}
                  >
                    <CardHeader>
                      <div
                        className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: f.accent + '18' }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: f.accent }}
                        />
                      </div>
                      <CardTitle
                        className="text-base font-semibold"
                        style={{ color: 'var(--evalua-dark)' }}
                      >
                        {f.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm leading-relaxed text-gray-500">
                        {f.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* ─── Architecture Diagram ──────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <motion.div
          className="mx-auto max-w-5xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="mb-2 text-center text-3xl font-bold"
            style={{ color: 'var(--evalua-dark)' }}
          >
            Arquitectura del Sistema
          </h2>
          <p className="mb-10 text-center text-sm text-gray-500">
            Flujo de datos desde el LMS host hasta la persistencia
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {archNodes.map((node, idx) => {
              const Icon = node.icon
              return (
                <div key={node.label} className="flex items-center gap-3 sm:gap-4">
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.12, duration: 0.4 }}
                  >
                    <div
                      className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl shadow-md transition-transform duration-200 hover:scale-105"
                      style={{ backgroundColor: node.color }}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <span
                      className="text-xs font-medium sm:text-sm"
                      style={{ color: 'var(--evalua-dark)' }}
                    >
                      {node.label}
                    </span>
                  </motion.div>

                  {idx < archNodes.length - 1 && (
                    <motion.div
                      className="hidden sm:flex items-center"
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.12 + 0.06, duration: 0.3 }}
                    >
                      <ArrowRight
                        className="h-5 w-5 text-gray-300"
                        strokeWidth={2.5}
                      />
                    </motion.div>
                  )}
                  {/* Mobile arrow on new line */}
                  {idx < archNodes.length - 1 && (
                    <motion.div
                      className="flex sm:hidden items-center"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                    >
                      <ArrowRight
                        className="h-4 w-4 rotate-90 text-gray-300"
                        strokeWidth={2.5}
                      />
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Flow description */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#394049' }}
              />
              Autenticación
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#EA7600' }}
              />
              Aplicación
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#C8102E' }}
              />
              Caché
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#198754' }}
              />
              Persistencia
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Tech Stack Badges ─────────────────────────────── */}
      <section
        className="px-4 py-16 sm:py-20"
        style={{ backgroundColor: '#f9fafb' }}
      >
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="mb-2 text-3xl font-bold"
            style={{ color: 'var(--evalua-dark)' }}
          >
            Stack Tecnológico
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            Construido con tecnologías modernas y probadas en producción
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {techBadges.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
              >
                <Badge
                  className="cursor-default gap-1.5 px-4 py-1.5 text-sm font-medium border-transparent text-white"
                  style={{ backgroundColor: b.color }}
                >
                  <Server className="h-3.5 w-3.5" />
                  {b.label}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer
        className="mt-auto px-4 py-6 text-center text-xs text-gray-400"
        style={{ backgroundColor: 'var(--evalua-dark)' }}
      >
        <p className="text-white/60">
          &copy; {new Date().getFullYear()} EvalUA. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
