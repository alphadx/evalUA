#!/bin/bash
set -e

# ============================================
# EvalUA v3.0 — Build All-in-One Image
# Genera imagen Docker con todo incluido
# y la exporta como .tar para distribución
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE_NAME="${1:-evalua-allinone:latest}"
TAR_OUTPUT="${2:-evalua-allinone.tar}"

echo "=========================================="
echo " EvalUA v3.0 — Build All-in-One"
echo "=========================================="
echo ""
echo " Imagen:  $IMAGE_NAME"
echo " Tar:     $TAR_OUTPUT"
echo " Contexto: $REPO_ROOT"
echo ""

echo "[1/2] Construyendo imagen Docker..."
docker build \
  -f "$SCRIPT_DIR/Dockerfile" \
  -t "$IMAGE_NAME" \
  "$REPO_ROOT"

echo ""
echo "[2/2] Exportando imagen a $TAR_OUTPUT..."
docker save "$IMAGE_NAME" -o "$SCRIPT_DIR/$TAR_OUTPUT"

TAR_SIZE=$(du -h "$SCRIPT_DIR/$TAR_OUTPUT" | cut -f1)
echo ""
echo "=========================================="
echo " Build completado"
echo "=========================================="
echo " Imagen: $IMAGE_NAME"
echo " Tar:    $SCRIPT_DIR/$TAR_OUTPUT ($TAR_SIZE)"
echo ""
echo " Para cargar en otro servidor:"
echo "   docker load -i $TAR_OUTPUT"
echo ""
echo " Para ejecutar:"
echo "   docker run -d -p 3000:3000 \\"
echo "     -v evalua-mongo:/data/db \\"
echo "     -v evalua-redis:/data/redis \\"
echo "     -e KEY=\"tu-clave-secreta\" \\"
echo "     $IMAGE_NAME"
echo ""
echo " Para subpath /evalua/ (detras de nginx):"
echo "   docker run -d -p 3000:3000 \\"
echo "     -v evalua-mongo:/data/db \\"
echo "     -v evalua-redis:/data/redis \\"
echo "     -e KEY=\"tu-clave-secreta\" \\"
echo "     -e NEXT_PUBLIC_BASE_PATH=/evalua \\"
echo "     $IMAGE_NAME"
echo "=========================================="