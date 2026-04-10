# Vercel Project Setup Guide

## Configuration Files

- **`vercel.json`** — Configuración estática del build (framework, buildCommand, etc.)
  - Contiene solo las propiedades válidas según docs de Vercel
  - Node.js version y environment variables se configuran en el dashboard, NO en vercel.json

## Dashboard Configuration (IMPORTANTE)

Debes configurar lo siguiente **directamente en Vercel Dashboard**:

### 1. Node.js Version
- Ve a **Project Settings → General**
- **Node.js Version**: Cambia a `20.x`
- Por defecto viene en `22.x`, pero tu package.json especifica `^18.20.2 || >=20.9.0`

### 2. Environment Variables
- Ve a **Project Settings → Environment Variables**
- Agrega una nueva variable:
  - **Name**: `NODE_OPTIONS`
  - **Value**: `--no-deprecation --max-old-space-size=4096`
  - **Environments**: `Production`, `Preview`, `Development`

### 3. Root Directory (ya debe estar correcto)
- Ve a **Project Settings → General**
- **Root Directory**: Debe estar vacío (raíz del monorepo)
- NO debe ser `/juan-portfolio`

### 4. Build & Development Settings
- **Framework Preset**: Next.js (detectado automáticamente)
- **Build Command**: Se toma de `vercel.json` → `pnpm build`
- **Install Command**: Se toma de `vercel.json` → `pnpm install --frozen-lockfile`
- **Output Directory**: `.next` (Next.js default)

## Testing the Setup

### 1. En GitHub (Automático)
```bash
# Cada push a main/develop triggerean el workflow
gh run list --workflow=build-validation.yml
```

### 2. En Vercel (Manual)
1. Dashboard → Deployments
2. Click en el último deployment
3. Haz click en "Redeploy" o espera a que detecte cambios en main
4. Monitorea los logs en Real Time

### Logs en Vercel
- **Build Logs**: Vercel → Deployments → [Deploy] → Logs
- Deberías ver:
  ```
  Cloning github.com/Sve-nnN/JuanPortfolio (Branch: main)
  Installing dependencies...
  Running "vercel build"
  > next build
  ```

## Si aún Falla

### Error: "No Next.js version detected"
1. Verifica que `package.json` esté en la **raíz del repo** (no en subdirectorio)
2. Verifica que `"next"` esté en `dependencies` (no devDependencies)
3. **Clear Cache**: Dashboard → Settings → Git → "Clear Cache"
4. Haz un nuevo push o redeploy manual

### Error: "Cannot find module..."
1. Verifica que `pnpm-lock.yaml` esté commiteado
2. Verifica que no haya archivos rotos en `src/`
3. Ejecuta localmente: `pnpm install && pnpm build`

### Error en Build Stats
- Si ves warnings de Node.js 20 → Ignora, es compatible
- Si ves errores de TypeScript → Revisa `pnpm lint` localmente

## Checklist Pre-Production

- [ ] `package.json` en raíz con `"next": "15.2.8"` en dependencies
- [ ] Node.js version = 20.x en Vercel dashboard
- [ ] NODE_OPTIONS env variable configurada en Vercel
- [ ] `vercel.json` con propiedades válidas
- [ ] `pnpm-lock.yaml` commiteado
- [ ] GitHub Actions passing en main
- [ ] Preview deployment successful en Vercel
- [ ] Production deployment successful

## Quick Vercel Commands

```bash
# Ver estado del proyecto en Vercel (requiere vercel CLI instalado)
vercel env pull                    # Descarga env vars
vercel deploy --prod              # Deploy manual a producción

# Via GH CLI
gh run list --workflow=build-validation.yml
```
