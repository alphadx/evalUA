// Mock Data for EvalUA v3.0 Mockup

export interface Descriptor {
  notaNivel: number;
  etiqueta: string;
  bulletPoints: string[];
}

export interface Criterio {
  id: string;
  nombre: string;
  ponderacion: number;
  tipo: "ESTRUCTURAL" | "COMPLEMENTARIO";
  esExcluyente: boolean;
  descripcion: string | null;
  minPalabras: number | null;
  maxPalabras: number | null;
  orden: number;
  descriptores: Descriptor[];
}

export interface Rubrica {
  id: string;
  titulo: string;
  esActiva: boolean;
  metadata: Record<string, unknown> | null;
  criterios: Criterio[];
  createdAt: string;
  updatedAt: string;
}

export interface Puntaje {
  criterioId: string;
  notaAsignada: number;
  observaciones: string | null;
}

export interface Evaluacion {
  id: string;
  rubricaId: string;
  estado: "EN_PROGRESO" | "COMPLETADA";
  notaFinal: number | null;
  observaciones: string | null;
  metadata: Record<string, unknown> | null;
  puntajes: Puntaje[];
  createdAt: string;
  updatedAt: string;
}

// ---- Mock Rubrics ----

export const mockRubrica1: Rubrica = {
  id: "rub-001",
  titulo: "Proyecto de Ingeniería de Software",
  esActiva: true,
  metadata: { version: 1, departamento: "Informática" },
  criterios: [
    {
      id: "crit-001",
      nombre: "Calidad del Código",
      ponderacion: 0.25,
      tipo: "ESTRUCTURAL",
      esExcluyente: true,
      descripcion: "Evalúa la calidad, limpieza y modularidad del código fuente entregado.",
      minPalabras: null,
      maxPalabras: null,
      orden: 1,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Código limpio y altamente modular", "Nomenclatura consistente y descriptiva", "Sin deudas técnicas detectables", "Cobertura de tests > 85%"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Código bien estructurado", "Buena nomenclatura con mínimas inconsistencias", "Baja deuda técnica", "Cobertura de tests > 70%"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Estructura funcional pero mejorable", "Nomenclatura aceptable", "Alguna deuda técnica presente", "Cobertura de tests > 50%"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Código funcional con modularidad limitada", "Nomenclatura poco consistente", "Deuda técnica moderada", "Cobertura de tests > 30%"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Estructura monolítica", "Nomenclatura pobre", "Alta deuda técnica", "Tests escasos o ausentes"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Código desorganizado y acoplado", "Sin convenciones de nomenclatura", "Deuda técnica crítica", "Sin tests"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Código incomprensible o no entregado", "No aplica ninguna convención", "Proyecto no funcional", "Sin evidencia de testing"] },
      ],
    },
    {
      id: "crit-002",
      nombre: "Diseño de Arquitectura",
      ponderacion: 0.25,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      descripcion: "Evalúa la arquitectura del sistema y la separación de responsabilidades.",
      minPalabras: null,
      maxPalabras: null,
      orden: 2,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Arquitectura bien definida y justificada", "Separación clara de capas", "Patrones de diseño correctamente aplicados", "Documentación arquitectónica completa"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Arquitectura clara con justificación", "Buena separación de capas", "Patrones de diseño aplicados", "Documentación adecuada"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Arquitectura funcional", "Separación de capas parcial", "Algunos patrones aplicados", "Documentación básica"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Arquitectura simple pero funcional", "Limitada separación de capas", "Patrones no evidentes", "Documentación insuficiente"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Arquitectura deficiente", "Sin separación de responsabilidades", "Sin patrones de diseño", "Sin documentación"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Arquitectura caótica", "Alto acoplamiento", "Anti-patrones presentes", "Sin documentación alguna"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin arquitectura discernible", "Código espagueti", "No se puede mantener", "No entregado"] },
      ],
    },
    {
      id: "crit-003",
      nombre: "Documentación Técnica",
      ponderacion: 0.20,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      descripcion: "Evalúa la calidad y completitud de la documentación del proyecto.",
      minPalabras: 100,
      maxPalabras: 5000,
      orden: 3,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Documentación completa y profesional", "README, API docs y guías de deploy", "Diagramas actualizados", "Ejemplos de uso claros"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Documentación completa", "README y API docs presentes", "Diagramas incluidos", "Ejemplos de uso"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Documentación adecuada", "README presente", "Algunos diagramas", "Ejemplos básicos"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Documentación mínima", "README con lo esencial", "Sin diagramas", "Sin ejemplos claros"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Documentación pobre", "README incompleto", "Sin diagramas ni ejemplos", "Difícil de entender el proyecto"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Casi sin documentación", "README vacío o inexistente", "Imposible replicar el entorno", "Sin guía alguna"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin documentación", "No se puede entender el proyecto", "No hay forma de ejecutarlo", "No entregado"] },
      ],
    },
    {
      id: "crit-004",
      nombre: "Trabajo en Equipo",
      ponderacion: 0.15,
      tipo: "COMPLEMENTARIO",
      esExcluyente: false,
      descripcion: "Evalúa la colaboración y distribución de tareas en el equipo.",
      minPalabras: null,
      maxPalabras: null,
      orden: 4,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Distribución equitativa de tareas", "Comunicación fluida y constante", "Uso efectivo de herramientas colaborativas", "Integración continua demostrada"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Buena distribución de tareas", "Comunicación regular", "Uso adecuado de herramientas", "Buena integración"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Distribución aceptable", "Comunicación suficiente", "Uso básico de herramientas", "Integración funcional"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Distribución desigual pero funcional", "Comunicación esporádica", "Uso limitado de herramientas", "Integración básica"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Distribución desequilibrada", "Comunicación deficiente", "Poco uso de herramientas", "Problemas de integración"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Sin distribución clara", "Sin comunicación", "Sin herramientas colaborativas", "Integración rota"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Trabajo individual disfrazado", "Sin colaboración", "Sin evidencia de trabajo en equipo", "No aplicable"] },
      ],
    },
    {
      id: "crit-005",
      nombre: "Presentación y Defensa",
      ponderacion: 0.15,
      tipo: "COMPLEMENTARIO",
      esExcluyente: false,
      descripcion: "Evalúa la calidad de la presentación del proyecto y la defensa ante el tribunal.",
      minPalabras: null,
      maxPalabras: null,
      orden: 5,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Presentación impecable y convincente", "Respuestas claras y fundamentadas", "Demo funcional sin errores", "Dominio total del tema"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Presentación clara y profesional", "Buenas respuestas a preguntas", "Demo funcional", "Buen dominio del tema"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Presentación adecuada", "Respuestas aceptables", "Demo con errores menores", "Conocimiento suficiente del tema"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Presentación básica", "Respuestas limitadas", "Demo con errores recuperables", "Conocimiento superficial"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Presentación desorganizada", "Respuestas vagas", "Demo con fallos importantes", "Conocimiento insuficiente"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Presentación pobre", "Sin respuestas coherentes", "Demo no funcional", "Desconocimiento del tema"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin presentación", "No responde preguntas", "Sin demo", "No se presenta"] },
      ],
    },
  ],
  createdAt: "2026-03-15T10:00:00Z",
  updatedAt: "2026-05-20T14:30:00Z",
};

export const mockRubrica2: Rubrica = {
  id: "rub-002",
  titulo: "Informe de Laboratorio de Química",
  esActiva: true,
  metadata: { version: 2, departamento: "Química" },
  criterios: [
    {
      id: "crit-201",
      nombre: "Procedimiento Experimental",
      ponderacion: 0.35,
      tipo: "ESTRUCTURAL",
      esExcluyente: true,
      descripcion: null,
      minPalabras: null,
      maxPalabras: null,
      orden: 1,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Procedimiento detallado y replicable", "Mediciones precisas registradas"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Procedimiento claro", "Buen registro de mediciones"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Procedimiento adecuado", "Mediciones aceptables"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Procedimiento básico", "Mediciones incompletas"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Procedimiento vago", "Mediciones ausentes"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Procedimiento incorrecto", "Sin mediciones"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin procedimiento", "No entregado"] },
      ],
    },
    {
      id: "crit-202",
      nombre: "Análisis de Resultados",
      ponderacion: 0.35,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      descripcion: null,
      minPalabras: null,
      maxPalabras: null,
      orden: 2,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Análisis profundo con fundamentos teóricos", "Gráficos y tablas claras"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Análisis completo", "Buena presentación visual"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Análisis funcional", "Presentación aceptable"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Análisis superficial", "Presentación básica"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Análisis incorrecto", "Sin presentación visual"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Sin análisis", "Datos sin procesar"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["No entregado", "Sin datos"] },
      ],
    },
    {
      id: "crit-203",
      nombre: "Conclusiones",
      ponderacion: 0.30,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      descripcion: null,
      minPalabras: 200,
      maxPalabras: 1000,
      orden: 3,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Conclusiones coherentes con datos", "Propuestas de mejora fundamentadas"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Buenas conclusiones", "Alguna propuesta de mejora"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Conclusiones aceptables", "Sin propuestas de mejora"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Conclusiones básicas", "Poco fundamentadas"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Conclusiones vagas", "Sin relación con datos"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Conclusiones erróneas", "Sin fundamentos"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin conclusiones", "No entregado"] },
      ],
    },
  ],
  createdAt: "2026-04-01T08:00:00Z",
  updatedAt: "2026-06-01T16:45:00Z",
};

export const mockRubrica3: Rubrica = {
  id: "rub-003",
  titulo: "Ensayo Académico — Literatura Universal",
  esActiva: false,
  metadata: { version: 1, departamento: "Humanidades" },
  criterios: [
    {
      id: "crit-301",
      nombre: "Tesis y Argumentación",
      ponderacion: 0.40,
      tipo: "ESTRUCTURAL",
      esExcluyente: true,
      descripcion: null,
      minPalabras: 500,
      maxPalabras: 2000,
      orden: 1,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Tesis original y bien delimitada", "Argumentación sólida y coherente"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Tesis clara", "Buena argumentación"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Tesis identificable", "Argumentación aceptable"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Tesis vaga", "Argumentación débil"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Sin tesis clara", "Argumentación confusa"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Sin tesis", "Sin argumentación"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["No entregado", "Sin contenido"] },
      ],
    },
    {
      id: "crit-302",
      nombre: "Estilo y Redacción",
      ponderacion: 0.30,
      tipo: "COMPLEMENTARIO",
      esExcluyente: false,
      descripcion: null,
      minPalabras: null,
      maxPalabras: null,
      orden: 2,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Redacción fluida y académica", "Vocabulario preciso y variado"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Buena redacción", "Vocabulario adecuado"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Redacción funcional", "Vocabulario aceptable"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Redacción básica", "Vocabulario limitado"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Redacción deficiente", "Vocabulario inadecuado"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Redacción incomprensible", "Sin estructura textual"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["No entregado", "Sin texto evaluable"] },
      ],
    },
    {
      id: "crit-303",
      nombre: "Bibliografía y Citas",
      ponderacion: 0.30,
      tipo: "COMPLEMENTARIO",
      esExcluyente: false,
      descripcion: null,
      minPalabras: null,
      maxPalabras: null,
      orden: 3,
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Fuentes variadas y pertinentes", "Citas en formato APA impecable"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Buenas fuentes", "Citas bien formateadas"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Fuentes adecuadas", "Citas con errores menores"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Fuentes mínimas", "Citas con errores"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Fuentes insuficientes", "Citas mal formateadas"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Sin fuentes", "Sin citas"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin bibliografía", "Plagio detectado"] },
      ],
    },
  ],
  createdAt: "2026-02-10T12:00:00Z",
  updatedAt: "2026-04-15T09:00:00Z",
};

export const mockRubricas: Rubrica[] = [mockRubrica1, mockRubrica2, mockRubrica3];

// ---- Mock Evaluations ----

export const mockEvaluaciones: Evaluacion[] = [
  {
    id: "eval-001",
    rubricaId: "rub-001",
    estado: "COMPLETADA",
    notaFinal: 5.4,
    observaciones: "Buen trabajo en general. El código es limpio pero la documentación necesita mejorar.",
    metadata: { reglaAplicada: "NORMAL", usuarioId: "prof.perez" },
    puntajes: [
      { criterioId: "crit-001", notaAsignada: 6.0, observaciones: "Modularización adecuada" },
      { criterioId: "crit-002", notaAsignada: 5.5, observaciones: "Arquitectura funcional" },
      { criterioId: "crit-003", notaAsignada: 4.0, observaciones: "Documentación mínima" },
      { criterioId: "crit-004", notaAsignada: 6.0, observaciones: null },
      { criterioId: "crit-005", notaAsignada: 5.0, observaciones: null },
    ],
    createdAt: "2026-05-21T10:30:00Z",
    updatedAt: "2026-05-21T11:15:00Z",
  },
  {
    id: "eval-002",
    rubricaId: "rub-001",
    estado: "COMPLETADA",
    notaFinal: 1.0,
    observaciones: "Reprobación automática por criterio excluyente Gatekeeper.",
    metadata: { reglaAplicada: "GATEKEEPER", usuarioId: "prof.gonzalez" },
    puntajes: [
      { criterioId: "crit-001", notaAsignada: 2.0, observaciones: "Código desorganizado y acoplado" },
      { criterioId: "crit-002", notaAsignada: 5.0, observaciones: null },
      { criterioId: "crit-003", notaAsignada: 4.5, observaciones: null },
      { criterioId: "crit-004", notaAsignada: 6.0, observaciones: null },
      { criterioId: "crit-005", notaAsignada: 5.5, observaciones: null },
    ],
    createdAt: "2026-05-22T09:00:00Z",
    updatedAt: "2026-05-22T09:45:00Z",
  },
  {
    id: "eval-003",
    rubricaId: "rub-002",
    estado: "COMPLETADA",
    notaFinal: 5.85,
    observaciones: "Buen informe de laboratorio con análisis sólido.",
    metadata: { reglaAplicada: "NORMAL", usuarioId: "prof.soto" },
    puntajes: [
      { criterioId: "crit-201", notaAsignada: 6.0, observaciones: "Procedimiento bien detallado" },
      { criterioId: "crit-202", notaAsignada: 6.0, observaciones: "Análisis completo" },
      { criterioId: "crit-203", notaAsignada: 5.5, observaciones: "Conclusiones aceptables" },
    ],
    createdAt: "2026-06-01T14:00:00Z",
    updatedAt: "2026-06-01T14:30:00Z",
  },
  {
    id: "eval-004",
    rubricaId: "rub-001",
    estado: "COMPLETADA",
    notaFinal: 6.25,
    observaciones: "Excelente proyecto con documentación destacada.",
    metadata: { reglaAplicada: "NORMAL", usuarioId: "prof.perez" },
    puntajes: [
      { criterioId: "crit-001", notaAsignada: 7.0, observaciones: "Código ejemplar" },
      { criterioId: "crit-002", notaAsignada: 6.5, observaciones: "Arquitectura bien diseñada" },
      { criterioId: "crit-003", notaAsignada: 6.0, observaciones: "Documentación profesional" },
      { criterioId: "crit-004", notaAsignada: 6.0, observaciones: null },
      { criterioId: "crit-005", notaAsignada: 5.5, observaciones: null },
    ],
    createdAt: "2026-06-05T16:00:00Z",
    updatedAt: "2026-06-05T16:45:00Z",
  },
  {
    id: "eval-005",
    rubricaId: "rub-002",
    estado: "COMPLETADA",
    notaFinal: 3.8,
    observaciones: "Informe deficiente. Reprobado por nota bajo 4.0.",
    metadata: { reglaAplicada: "NORMAL", usuarioId: "prof.soto" },
    puntajes: [
      { criterioId: "crit-201", notaAsignada: 3.0, observaciones: "Procedimiento vago" },
      { criterioId: "crit-202", notaAsignada: 4.0, observaciones: "Análisis superficial" },
      { criterioId: "crit-203", notaAsignada: 4.5, observaciones: "Conclusiones básicas" },
    ],
    createdAt: "2026-06-08T11:00:00Z",
    updatedAt: "2026-06-08T11:30:00Z",
  },
  {
    id: "eval-006",
    rubricaId: "rub-001",
    estado: "EN_PROGRESO",
    notaFinal: null,
    observaciones: null,
    metadata: { usuarioId: "prof.perez" },
    puntajes: [
      { criterioId: "crit-001", notaAsignada: 5.0, observaciones: "Código funcional" },
    ],
    createdAt: "2026-06-10T22:00:00Z",
    updatedAt: "2026-06-10T22:10:00Z",
  },
  {
    id: "eval-007",
    rubricaId: "rub-002",
    estado: "EN_PROGRESO",
    notaFinal: null,
    observaciones: null,
    metadata: { usuarioId: "prof.soto" },
    puntajes: [
      { criterioId: "crit-201", notaAsignada: 6.0, observaciones: null },
      { criterioId: "crit-202", notaAsignada: 5.0, observaciones: null },
    ],
    createdAt: "2026-06-11T08:00:00Z",
    updatedAt: "2026-06-11T08:25:00Z",
  },
  {
    id: "eval-008",
    rubricaId: "rub-001",
    estado: "COMPLETADA",
    notaFinal: 4.55,
    observaciones: "Proyecto aprobado con lo mínimo. Necesita mejorar en varios aspectos.",
    metadata: { reglaAplicada: "NORMAL", usuarioId: "prof.gonzalez" },
    puntajes: [
      { criterioId: "crit-001", notaAsignada: 4.0, observaciones: "Código funcional" },
      { criterioId: "crit-002", notaAsignada: 5.0, observaciones: "Arquitectura simple" },
      { criterioId: "crit-003", notaAsignada: 4.0, observaciones: "Documentación básica" },
      { criterioId: "crit-004", notaAsignada: 5.0, observaciones: null },
      { criterioId: "crit-005", notaAsignada: 4.5, observaciones: null },
    ],
    createdAt: "2026-06-12T10:00:00Z",
    updatedAt: "2026-06-12T10:40:00Z",
  },
];

// Helper to get rubrica title by ID
export function getRubricaTitle(rubricaId: string): string {
  const rubrica = mockRubricas.find(r => r.id === rubricaId);
  return rubrica?.titulo || "Rúbrica desconocida";
}

// Helper to format date
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
