# Skill: Gherkin Test Generator

## Propósito
Generar tests unitarios e integración a partir de archivos `.feature` (Gherkin/BDD) existentes en `documentacion/especificaciones/`.

## Instrucciones
Cuando el usuario solicite generar tests para un feature file o cuando se detecte un archivo `.feature` nuevo o modificado:

### Flujo de Trabajo
1. **Leer** el archivo `.feature` desde `documentacion/especificaciones/`
2. **Extraer** cada escenario y sus pasos (Given/When/Then)
3. **Generar** el archivo de step definitions con Vitest
4. **Generar** los tests unitarios correspondientes para la lógica de dominio involucrada

### Estructura de Salida
```
src/__tests__/
├── features/
│   └── [nombre-feature].feature.test.ts    # Step definitions
├── domain/
│   └── [entidad].test.ts                   # Tests de dominio puro
└── integration/
    └── [entidad].repository.test.ts         # Tests de repositorio
```

### Plantilla de Step Definitions
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature: [nombre del feature]', () => {
  // Setup común del escenario
  beforeEach(() => {
    // Inicializar agregados y repositorios mock
  });

  describe('Escenario: [nombre del escenario]', () => {
    it('should [resultado esperado del Then]', async () => {
      // Given - Arrange
      // [implementar pasos Given]

      // When - Act
      // [implementar pasos When]

      // Then - Assert
      // [implementar pasos Then con expect()]
    });
  });
});
```

### Reglas
- Cada escenario Gherkin → un bloque `describe` con sub-tests
- Los pasos Given → setup/arrange
- Los pasos When → act/ejecución
- Los pasos Then → assertions/expect
- Usar `vitest` como runner (NO jest ni cucumber directo)
- Los tests de dominio NO deben depender de MongoDB ni Redis
- Para tests de integración, usar `mongodb-memory-server`
- Mockear Redis con `ioredis-mock` en tests de integración

### Ejemplo de Uso
Usuario: "Generar tests para R-2.1-reglas-dominio.feature"
→ Leer el feature file y generar todos los test files correspondientes