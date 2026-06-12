# Hook: Post-Commit Test Runner

## Propósito
Ejecutar tests automáticamente después de cada commit para detectar regresiones tempranas.

## Implementación
Crear el archivo `.husky/post-commit` con el siguiente contenido:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Ejecutar tests de dominio (rápidos, sin dependencias externas)
npx vitest run --reporter=verbose src/__tests__/domain/ 2>/dev/null || true
```

## Configuración de Vitest (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/domain/**', 'src/application/**'],
      exclude: ['src/**/__tests__/**'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

## Estructura de Tests
```
src/__tests__/
├── setup.ts                    # Setup global (mock Redis, etc.)
├── domain/
│   ├── rubrica.test.ts         # Tests de dominio puro de Rúbrica
│   └── evaluacion.test.ts      # Tests de dominio puro de Evaluación
├── application/
│   ├── crear-rubrica.test.ts   # Tests de use-cases
│   └── calcular-evaluacion.test.ts
├── integration/
│   ├── rubrica.repository.test.ts    # Tests con mongodb-memory-server
│   └── evaluacion.repository.test.ts
└── features/
    ├── R-2.1-reglas-dominio.feature.test.ts  # Gherkin → Vitest
    └── ...
```

## Reglas
- El post-commit NO bloquea (usa `|| true`) — es informativo, no restrictivo
- Solo ejecuta tests de dominio (rápidos) en post-commit
- Los tests de integración y E2E se ejecutan en CI/CD pipeline
- Mantener tests de dominio < 5 segundos de ejecución total