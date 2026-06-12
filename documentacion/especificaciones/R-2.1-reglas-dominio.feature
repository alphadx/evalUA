# language: es

Característica: Reglas de Dominio y Cálculo de Notas (DDD)
  Como motor de evaluación de EvalUA
  Quiero aplicar de forma consistente las reglas de agregados, cálculo de notas y el Gatekeeper
  Para asegurar la validez académica y técnica de los resultados.

  Antecedentes:
    Dado que existe una Rúbrica con ID "rub-1"
    Y la rúbrica tiene los siguientes criterios estructurales:
      | Criterio ID | Nombre       | Ponderación | Es Excluyente |
      | crit-1      | Estructura   | 0.50        | false         |
      | crit-2      | Contenido    | 0.50        | true          |

  Escenario: Validación de sumatoria de ponderaciones en Rúbrica
    Cuando intento establecer en la rúbrica los siguientes criterios estructurales:
      | Criterio ID | Nombre       | Ponderación |
      | crit-1      | Estructura   | 0.40        |
      | crit-2      | Contenido    | 0.40        |
    Entonces la validación debe fallar indicando que la suma de ponderaciones de criterios estructurales debe ser exactamente 1.0

  Escenario: Cálculo de nota normal con exigencia al 60% sin activar Gatekeeper
    Dado que tengo una Evaluación iniciada para la rúbrica "rub-1"
    Cuando registro las siguientes calificaciones por criterio:
      | Criterio ID | Nota Asignada |
      | crit-1      | 5.8           |
      | crit-2      | 4.6           |
    Y la exigencia de la evaluación está configurada al 60%
    Y finalizo y calculo la evaluación
    Entonces la evaluación cambia su estado a "COMPLETADA"
    Y la nota final calculada debe ser "5.20"

  Escenario: Cálculo de nota con reprobación en criterio excluyente (Gatekeeper activado)
    Dado que tengo una Evaluación iniciada para la rúbrica "rub-1"
    Cuando registro las siguientes calificaciones por criterio:
      | Criterio ID | Nota Asignada |
      | crit-1      | 7.0           |
      | crit-2      | 3.8           |
    Y la exigencia de la evaluación está configurada al 60%
    Y finalizo y calculo la evaluación
    Entonces la evaluación cambia su estado a "COMPLETADA"
    Y la nota final calculada debe ser "1.0" debido a la regla del Gatekeeper

  Escenario: Transiciones de estado de la evaluación en la Máquina de Estados (FSM)
    Dado que tengo una Evaluación iniciada para la rúbrica "rub-1" en estado "EN_PROGRESO"
    Cuando registro la calificación para el criterio "crit-1" como "5.0"
    Y registro la calificación para el criterio "crit-2" como "6.0"
    Entonces el estado de la evaluación debe pasar a "EN_REVISION"
    Cuando el evaluador modifica la calificación de "crit-1" a "4.0"
    Entonces el estado de la evaluación debe regresar a "EN_PROGRESO"

  Escenario: Inmutabilidad de una evaluación completada
    Dado que tengo una Evaluación para la rúbrica "rub-1" en estado "COMPLETADA"
    Cuando intento registrar la calificación para el criterio "crit-1" como "6.0"
    Entonces la operación debe ser rechazada indicando que el documento es inmutable
