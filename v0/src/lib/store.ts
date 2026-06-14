/**
 * EvalUA v3.0 — Zustand Store
 * Estado global de la aplicación
 */

import { create } from "zustand";

interface PuntajeLocal {
  criterioId: string;
  notaAsignada: number;
  observaciones: string | null;
}

interface EvaluacionDraft {
  evaluacionId: string;
  rubricaId: string;
  estado: "EN_PROGRESO" | "EN_REVISION";
  observaciones: string | null;
  puntajes: PuntajeLocal[];
  usuarioId?: string | null;
}

interface RubricaData {
  _id: string;
  rubricaGroupId: string;
  version: number;
  titulo: string;
  esActiva: boolean;
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: "ESTRUCTURAL" | "COMPLEMENTARIO";
    esExcluyente: boolean;
    descripcion: string | null;
    descriptores: Array<{
      notaNivel: number;
      etiqueta: string;
      bulletPoints: string[];
    }>;
  }>;
}

interface AppState {
  // Auth
  token: string | null;
  rol: string | null;
  allowedModes: string[];
  setAuth: (token: string, rol: string, allowedModes: string[]) => void;

  // Wizard
  evaluacionActiva: EvaluacionDraft | null;
  rubricaDetallada: RubricaData | null;
  criterioIndiceActivo: number;
  loadingCalculo: boolean;

  setEvaluacionActiva: (evaluacion: EvaluacionDraft | null) => void;
  setRubricaDetallada: (rubrica: RubricaData | null) => void;
  setCriterioIndiceActivo: (index: number) => void;
  setLoadingCalculo: (loading: boolean) => void;
  guardarPuntajeLocal: (
    criterioId: string,
    nota: number,
    observaciones?: string
  ) => void;
  resetWizard: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  token: null,
  rol: null,
  allowedModes: [],
  setAuth: (token, rol, allowedModes) => set({ token, rol, allowedModes }),

  // Wizard
  evaluacionActiva: null,
  rubricaDetallada: null,
  criterioIndiceActivo: 0,
  loadingCalculo: false,

  setEvaluacionActiva: (evaluacion) => set({ evaluacionActiva: evaluacion }),
  setRubricaDetallada: (rubrica) => set({ rubricaDetallada: rubrica }),
  setCriterioIndiceActivo: (index) => set({ criterioIndiceActivo: index }),
  setLoadingCalculo: (loading) => set({ loadingCalculo: loading }),

  guardarPuntajeLocal: (criterioId, nota, observaciones) => {
    const evaluacion = get().evaluacionActiva;
    if (!evaluacion) return;

    const puntajes = [...evaluacion.puntajes];
    const idx = puntajes.findIndex((p) => p.criterioId === criterioId);
    const puntaje: PuntajeLocal = {
      criterioId,
      notaAsignada: nota,
      observaciones: observaciones || null,
    };

    if (idx !== -1) {
      puntajes[idx] = puntaje;
    } else {
      puntajes.push(puntaje);
    }

    set({
      evaluacionActiva: {
        ...evaluacion,
        puntajes,
      },
    });
  },

  resetWizard: () =>
    set({
      evaluacionActiva: null,
      rubricaDetallada: null,
      criterioIndiceActivo: 0,
      loadingCalculo: false,
    }),
}));
