 **matriz de riesgo detallada para las 44 actividades del plan de desarrollo**. Acompañado ODS editable, lista para usar como insumo de gestión del proyecto y para vincularla con la carta Gantt.

**Archivo:** [Descargar matriz de riesgos EvalUA v3.0](sandbox:/mnt/data/matriz_riesgos_evalua_v3.xlsx)

La matriz fue elaborada considerando la arquitectura definida para EvalUA v3.0: micro-frontend embebido, operación 100% iframe-driven, JWT HS256 emitido por el Host, modelo Zero-Knowledge, MongoDB para persistencia, Redis para borradores/cache y despliegue Docker Compose.  

## Contenido del archivo

El ODS contiene cuatro hojas:

| Hoja                  | Contenido                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Resumen**           | Indicadores globales, distribución de riesgos por nivel, riesgo inicial vs residual y top 10 de riesgos prioritarios. |
| **Matriz de Riesgos** | Matriz completa con 44 riesgos, uno por cada actividad del plan Gantt.                                                |
| **Escalas**           | Definición de probabilidad, impacto, exposición y niveles Bajo/Medio/Alto/Crítico.                                    |
| **Fuentes**           | Documentos técnicos usados como base para construir los riesgos.                                                      |

## Estructura de la matriz

Cada actividad del plan tiene una fila de riesgo con los siguientes campos:

| Campo                                    | Descripción                                                      |
| ---------------------------------------- | ---------------------------------------------------------------- |
| **ID Riesgo**                            | Identificador único del riesgo.                                  |
| **Fase**                                 | Fase del plan de desarrollo.                                     |
| **ID Act.**                              | ID de actividad correspondiente al plan Gantt.                   |
| **Actividad / entregable**               | Actividad exacta del plan.                                       |
| **Entregable crítico**                   | Producto o evidencia esperada de la actividad.                   |
| **Riesgo específico**                    | Riesgo principal asociado a la actividad.                        |
| **Causa probable**                       | Origen esperado del riesgo.                                      |
| **Impacto en proyecto**                  | Consecuencia si el riesgo ocurre.                                |
| **P**                                    | Probabilidad inicial, de 1 a 5.                                  |
| **I**                                    | Impacto inicial, de 1 a 5.                                       |
| **Exposición**                           | Fórmula `P × I`.                                                 |
| **Nivel**                                | Bajo, Medio, Alto o Crítico.                                     |
| **Señales tempranas**                    | Indicadores para detectar el riesgo antes de que se materialice. |
| **Mitigación preventiva**                | Acción para reducir probabilidad o impacto.                      |
| **Plan de contingencia**                 | Acción si el riesgo ocurre.                                      |
| **Responsable**                          | Rol dueño del riesgo.                                            |
| **Momento de control**                   | Punto del calendario o fase donde debe revisarse.                |
| **P residual / I residual**              | Probabilidad e impacto esperados después de aplicar mitigación.  |
| **Exposición residual / Nivel residual** | Riesgo remanente esperado.                                       |
| **Fuente / criterio de diseño**          | Base técnica o funcional que justifica el riesgo.                |

## Criterio de clasificación usado

| Exposición | Nivel   | Tratamiento                                                        |
| ---------: | ------- | ------------------------------------------------------------------ |
|        1–4 | Bajo    | Seguimiento normal.                                                |
|        5–9 | Medio   | Mitigación planificada.                                            |
|      10–14 | Alto    | Mitigación obligatoria y revisión por PM/Tech Lead.                |
|      15–25 | Crítico | Escalamiento inmediato, contingencia definida y control ejecutivo. |

## Resultado ejecutivo de la matriz

La matriz identifica **44 riesgos**, uno por cada actividad del plan. La distribución inicial queda concentrada en riesgos críticos y altos porque el proyecto tiene dependencias sensibles en seguridad, integración Host/Iframe, cálculo de notas, persistencia Redis/MongoDB, privacidad Zero-Knowledge y salida productiva.

| Indicador                             | Resultado |
| ------------------------------------- | --------: |
| Total de riesgos                      |        44 |
| Riesgos críticos iniciales            |        31 |
| Riesgos altos iniciales               |        11 |
| Riesgos medios iniciales              |         2 |
| Riesgos críticos residuales esperados |         0 |
| Riesgos altos residuales esperados    |         0 |

El riesgo residual baja de forma importante porque cada fila incluye mitigación preventiva y contingencia específica. Esto supone que las mitigaciones se ejecutan efectivamente durante la fase correspondiente.

## Riesgos más relevantes identificados

| ID    | Actividad           | Riesgo                                                 | Nivel inicial | Mitigación clave                                                                                      |
| ----- | ------------------- | ------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------- |
| R-2.1 | Entidades DDD       | Reglas de dominio mal implementadas                    | Crítico       | Pruebas unitarias exhaustivas sobre Nota, Rúbrica, Evaluación, ponderaciones y Gatekeeper.            |
| R-2.3 | Redis TTL/cache     | Pérdida de borradores o rúbricas obsoletas             | Crítico       | Tests de TTL, serialización, cache HIT/MISS e invalidación Redis.                                     |
| R-3.1 | JWT, claims y roles | Acceso no autorizado o rechazo erróneo                 | Crítico       | Matriz rol-modo-claim, pruebas positivas/negativas y validación `iss`, `aud`, `exp`, `id_plataforma`. |
| R-4.1 | CRUD rúbricas       | Modificación no autorizada o versionamiento incorrecto | Crítico       | Tests de ownership, versionamiento inmutable e invalidación de cache L2.                              |
| R-4.3 | Cálculo final       | Nota final incorrecta o doble consolidación            | Crítico       | Validación `EN_REVISION`, bloqueo 409, pruebas Gatekeeper y verificación de borrado Redis.            |
| R-5.4 | Auto-save           | Pérdida de avance del evaluador                        | Crítico       | Autosave con debounce, retry, timestamps, indicador visual y prueba de cierre/reapertura.             |
| R-7.1 | postMessage         | Eventos incompatibles con Host o inseguros             | Crítico       | Contrato TypeScript compartido, envelope versionado y pruebas con listener Host.                      |
| R-8.3 | Seguridad           | Brecha de privacidad o Zero-Knowledge                  | Crítico       | Threat modeling, pruebas JWT, PII scan, revisión de logs, CSP y expiración de tokens.                 |
| R-9.4 | Producción          | Falla de despliegue o rollback                         | Crítico       | Backup previo, rollback ensayado, smoke test funcional y canal de incidentes.                         |

Los riesgos sobre Redis/MongoDB se derivan del ciclo de vida definido: borradores activos en `draft:{evaluacionId}` con TTL de 30 días, cache L2 `cache:rubrica:{rubricaId}` con TTL de 24 horas y consolidación final en MongoDB.  Los riesgos de API consideran los contratos de CRUD, launch, autosave, cálculo final, errores 401/403/409 y control de roles. 

## Estrategia general de mitigación

La matriz usa una estrategia de mitigación por capas:

1. **Gobernanza del alcance:** trazabilidad entre actividades, HU-03 a HU-11, criterios de aceptación y evidencias UAT. 
2. **Controles técnicos tempranos:** ADRs, spike de arquitectura, CI/CD, Docker Compose, healthchecks, variables de entorno y ambientes reproducibles.
3. **Seguridad por diseño:** validación estricta de JWT, roles por modo, `id_plataforma`, expiración del token, CSP y pruebas 401/403. 
4. **Integridad del dominio:** pruebas unitarias sobre ponderaciones, escala 1.0–7.0, estados de evaluación, inmutabilidad y regla Gatekeeper. 
5. **Protección de datos:** cumplimiento Zero-Knowledge, ausencia de PII, retención de borradores por TTL y control de acceso a evaluaciones. 
6. **Experiencia embebida:** pruebas visuales y funcionales dentro del viewport fijo 1029×466, con scroll local y sin scroll global. 
7. **Integración Host/Iframe:** contrato `postMessage`, harness representativo, matriz rol/modo y pruebas end-to-end.
8. **Preparación productiva:** runbooks, backups, monitoreo, release candidate, smoke test y rollback ensayado.

