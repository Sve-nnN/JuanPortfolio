# Deployment & CI/CD Guide

## Overview

Este proyecto utiliza GitHub Actions para validación de builds y Vercel para deployment automático a producción.

## GitHub Actions CI/CD

### Build Validation Workflow (`.github/workflows/build-validation.yml`)

Se ejecuta automáticamente en:
- **Push a `main` o `develop`**
- **Pull Requests contra `main` o `develop`**

#### Pasos:
1. ✅ **Lint** — Validación de código con ESLint
2. ✅ **Build** — Construcción de Next.js (`pnpm build`)
3. ✅ **Type Check** — Verificación de tipos (Payload schema)
4. ✅ **Tests** — Suite de pruebas integration (`pnpm test:int`)

#### Requisitos para Merge:
- ✅ Workflow completado exitosamente
- ✅ Todas las checks de CI/CD pasadas

**Si el build falla en CI, no se puede hacer merge a main.** Esto previene que código defectuoso llegue a producción.

## Vercel Deployment

### Configuración Requerida

1. **Root Directory**: Verificar que esté vacío o apunte a `/` (raíz del repo)
   - No debe ser `/juan-portfolio` ni `/public`
   - El proyecto está en la raíz del monorepo

2. **Build Command**: Se define en `vercel.json`
   ```json
   {
     "buildCommand": "pnpm install --frozen-lockfile && pnpm build",
     "installCommand": "pnpm install --frozen-lockfile",
     "framework": "nextjs",
     "nodeVersion": "20.x"
   }
   ```

3. **Environment Variables**:
   - Asegurar que todas las vars de desarrollo/producción estén configuradas
   - NODE_OPTIONS se define automáticamente en vercel.json

### Automatic Deployments

- **Preview Deployments**: En cada Push a cualquier rama (excepto main)
  - Se genera una URL de preview
  - Útil para testing antes de merge

- **Production Deployment**: Solo cuando se hace Push/Merge a `main`
  - **REQUIERE** que el CI/CD workflow haya pasado en main
  - Deployment automático a https://tu-dominio.com

### Troubleshooting

#### "No Next.js version detected"

Si ves este error en Vercel:

1. **Verificar Root Directory en Vercel Dashboard**:
   - Settings → Project Settings → Root Directory
   - Debe estar vacío o ser `/`

2. **Clear Cache y Rebuild**:
   - Vercel Dashboard → Settings → Git
   - "Clear Cache" y hacer un nuevo push

3. **Verificar package.json**:
   - Asegurar que "next" esté en dependencies (no devDependencies)
   - Verificado: ✅ "next": "15.2.8" en línea 89

#### Build Timeouts

Si el build tarda más de 45 minutos:
- Optimizar assets (imágenes con sharp)
- Aumentar max-old-space-size en NODE_OPTIONS
- Verificado: ✅ Ya está configurado a 4096MB

## Local Development

Para simular el build de Vercel localmente:

```bash
# Instalar dependencias
pnpm install

# Build exactamente como lo hace Vercel
NODE_OPTIONS='--no-deprecation --max-old-space-size=4096' pnpm build

# Servir produción localmente
pnpm start
```

## Branch Protection

Configurar en GitHub:

1. **Settings → Branches → Add rule**
2. **Branch name pattern**: `main`
3. **Require status checks to pass**:
   - ✅ build (Build Validation)
   - ✅ tests (Build Validation)
4. **Require branches to be up to date**
5. **Dismiss stale pull request approvals**

## Workflow

```
Feature Branch
     ↓
[Push] → CI/CD Validation (build, lint, test)
     ↓
[Pass] → Can Merge PR
     ↓
[Merge to main] → Vercel Preview + Final Validation
     ↓
[Auto Deploy] → Production (only if all checks pass)
```

## Files Modified

- ✅ `.github/workflows/build-validation.yml` — Nuevo workflow de CI/CD
- ✅ `vercel.json` — Configuración explícita de Vercel
- ✅ `.vercelignore` — Optimización de build en Vercel
- ✅ `package.json` — Agregado script `vercel-build`

## Próximos Pasos

1. **Commit y Push** estos cambios a main (o crear un PR primero)
2. **Vercel Dashboard**:
   - Verificar Root Directory está correcto
   - Hacer trigger manual de un nuevo build
   - Monitorear logs en "Deployments"
3. **GitHub**:
   - Configurar branch protection rules en `main`
   - Requerir que las checks de CI/CD pasen
4. **Test**: 
   - Hacer un PR contra main
   - Verificar que CI/CD corre
   - Verificar que preview deploy funciona
