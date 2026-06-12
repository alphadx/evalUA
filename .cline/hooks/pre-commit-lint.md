# Hook: Pre-Commit Lint & Type Check

## Propósito
Ejecutar verificaciones automáticas antes de cada commit para mantener la calidad del código.

## Implementación
Crear el archivo `.husky/pre-commit` con el siguiente contenido:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 1. TypeScript type check
npx tsc --noEmit

# 2. ESLint
npx eslint . --fix --max-warnings=0

# 3. Prettier format check
npx prettier --check .

# 4. Verificar que no hay secrets hardcodeados
npx secretlint "**/*"
```

## Paquetes Requeridos
```json
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@secretlint/secretlint": "^8.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

## Configuración en package.json
```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{md,json,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## Reglas
- El commit se BLOQUEA si hay errores de TypeScript
- El commit se BLOQUEA si hay warnings de ESLint no resueltos
- El commit se BLOQUEA si se detectan secrets hardcodeados
- lint-staged ejecuta las verificaciones SOLO en archivos staged (más rápido)