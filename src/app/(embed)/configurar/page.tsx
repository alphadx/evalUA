"use client";

/**
 * EvalUA v3.0 — Configuración del Sistema (Iframe)
 * Solo ADMINISTRADOR - Panel de parámetros
 */

import { useEffect, useState } from "react";

interface ConfigItem {
  _id: string;
  clave: string;
  valor: string;
  descripcion: string;
}

export default function ConfigurarPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch("/api/configuracion", {
          headers: { Authorization: "Bearer dev-token" },
        });
        const data = await res.json();
        if (data.success) {
          setConfigs(data.data);
        } else {
          setError(data.error?.detail || "Error cargando configuraciones");
        }
      } catch {
        setError("Error de red");
      }
      setLoading(false);
    };
    cargar();
  }, []);

  const handleGuardar = async (clave: string) => {
    try {
      const res = await fetch(`/api/configuracion/${clave}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer dev-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ valor: nuevoValor }),
      });
      const data = await res.json();
      if (data.success) {
        setConfigs((prev) =>
          prev.map((c) => (c.clave === clave ? { ...c, valor: nuevoValor } : c))
        );
        setEditando(null);
      } else {
        setError(data.error?.detail || "Error actualizando");
      }
    } catch {
      setError("Error de red");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ color: "var(--color-evalUA2)" }}>Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-2 border-b"
        style={{ borderColor: "rgba(57,64,73,0.15)" }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-evalUA1)" }}
        >
          Configuración del Sistema
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {configs.length === 0 ? (
          <div
            className="text-xs text-center py-4"
            style={{ color: "rgba(57,64,73,0.5)" }}
          >
            No hay configuraciones registradas
          </div>
        ) : (
          configs.map((config) => (
            <div
              key={config._id}
              className="border rounded p-3"
              style={{ borderColor: "rgba(57,64,73,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className="text-sm font-medium font-mono"
                    style={{ color: "var(--color-evalUA2)" }}
                  >
                    {config.clave}
                  </span>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(57,64,73,0.5)" }}
                  >
                    {config.descripcion}
                  </p>
                </div>
                {editando === config.clave ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded px-2 py-1 text-xs w-32"
                      style={{ borderColor: "rgba(57,64,73,0.2)" }}
                      value={nuevoValor}
                      onChange={(e) => setNuevoValor(e.target.value)}
                    />
                    <button
                      className="px-2 py-1 text-xs rounded text-white"
                      style={{ backgroundColor: "var(--color-evalUA21)" }}
                      onClick={() => handleGuardar(config.clave)}
                    >
                      OK
                    </button>
                    <button
                      className="px-2 py-1 text-xs rounded border"
                      style={{ borderColor: "rgba(57,64,73,0.3)" }}
                      onClick={() => setEditando(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(157,212,211,0.2)",
                        color: "var(--color-evalUA2)",
                      }}
                    >
                      {config.valor}
                    </span>
                    <button
                      className="text-xs px-2 py-1 rounded border hover:opacity-80"
                      style={{ borderColor: "rgba(57,64,73,0.2)" }}
                      onClick={() => {
                        setEditando(config.clave);
                        setNuevoValor(config.valor);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {error && (
        <div
          className="px-4 py-1 text-xs"
          style={{ color: "var(--color-evalUA8)" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
