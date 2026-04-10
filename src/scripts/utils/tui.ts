#!/usr/bin/env node
/**
 * JuanPortfolio Utils — TUI para gestionar y ejecutar scripts de utilidades
 *
 * Uso: pnpm utils
 */

import * as p from '@clack/prompts'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

import { SCRIPTS, CATEGORIES, buildCommand } from './registry.js'
import type { Param } from './registry.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '../../..') // src/scripts/utils → repo root

// ─── Type hints visibles en las preguntas de parámetros ──────────────────────

const TYPE_HINT: Record<string, string> = {
  flag: '[flag]',
  select: '[selección]',
  string: '[texto]',
  number: '[número]',
  positional: '[requerido]',
}

// ─── Prompt individual para un parámetro ─────────────────────────────────────

async function promptParam(param: Param, index: number, total: number): Promise<unknown> {
  const progress = total > 1 ? ` (${index + 1}/${total})` : ''
  const hint = TYPE_HINT[param.type] ?? ''
  const reqLabel = param.required ? ' *' : ''
  const label = param.key || param.name
  const message = `${label} ${hint}${reqLabel}${progress}  —  ${param.description}`

  if (param.type === 'flag') {
    const result = await p.confirm({
      message,
      initialValue: (param.default as boolean) ?? false,
    })
    if (p.isCancel(result)) return null
    return result
  }

  if (param.type === 'select') {
    const result = await p.select({
      message,
      options: param.options!,
      initialValue: (param.default as string) ?? '',
    })
    if (p.isCancel(result)) return null
    return result
  }

  // string, number, positional
  const isOptional = !param.required
  const result = await p.text({
    message,
    placeholder: param.placeholder ?? (isOptional ? '(opcional, Enter para omitir)' : ''),
    defaultValue: param.default !== undefined ? String(param.default) : undefined,
    validate:
      param.validate ??
      (param.required ? (v) => (!v?.trim() ? 'Este campo es requerido' : undefined) : undefined),
  })
  if (p.isCancel(result)) return null
  if (param.type === 'number' && result !== '') return Number(result)
  return result
}

// ─── Ejecución de comando ─────────────────────────────────────────────────────

function runCommand(bin: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: 'inherit', cwd })
    child.on('close', (code) => resolve(code ?? 0))
    child.on('error', (err) => {
      p.log.error(`Error al lanzar el proceso: ${err.message}`)
      p.log.warn('¿Está tsx disponible? Prueba: npx tsx --version')
      resolve(1)
    })
  })
}

// ─── TUI principal ────────────────────────────────────────────────────────────

const BACK = '___BACK___'

async function main() {
  console.clear()
  p.intro('  JuanPortfolio Utils — Gestor de Scripts  ')

  const scriptsByCategory = SCRIPTS.reduce<Record<string, typeof SCRIPTS>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category]!.push(s)
    return acc
  }, {})

  let continueRunning = true

  while (continueRunning) {
    // ── Paso 1: Categoría ────────────────────────────────────────────────────

    const categoryChoice = await p.select({
      message: 'Selecciona una categoría:',
      options: [
        {
          value: 'all',
          label: '⭐  Todos los scripts',
          hint: `${SCRIPTS.length} scripts disponibles`,
        },
        ...Object.entries(CATEGORIES).map(([key, meta]) => ({
          value: key,
          label: meta.label,
          hint: `${meta.hint} · ${scriptsByCategory[key]?.length ?? 0} scripts`,
        })),
      ],
    })

    if (p.isCancel(categoryChoice)) {
      p.cancel('Hasta luego.')
      process.exit(0)
    }

    // ── Paso 2: Script ────────────────────────────────────────────────────────

    const filtered =
      categoryChoice === 'all' ? SCRIPTS : (scriptsByCategory[categoryChoice as string] ?? [])

    const scriptId = await p.select({
      message: 'Selecciona un script:',
      options: [
        { value: BACK, label: '← Volver a categorías', hint: '' },
        ...filtered.map((s) => ({
          value: s.id,
          label: s.name,
          hint: s.description,
        })),
      ],
    })

    if (p.isCancel(scriptId) || scriptId === BACK) {
      if (p.isCancel(scriptId)) {
        p.cancel('Hasta luego.')
        process.exit(0)
      }
      continue // vuelve al inicio del while (selección de categoría)
    }

    const script = SCRIPTS.find((s) => s.id === scriptId)!

    // ── Paso 3: Detalle del script ─────────────────────────────────────────

    const paramsCount = script.params.length
    const examplesText =
      script.examples && script.examples.length > 0
        ? '\nEjemplos:\n' + script.examples.map((e) => `  $ ${e}`).join('\n')
        : ''
    const paramsText = paramsCount > 0 ? `\n${paramsCount} parámetro${paramsCount > 1 ? 's' : ''} configurables` : '\nSin parámetros configurables — se ejecuta directamente'

    p.note(script.longDescription + examplesText + paramsText, script.name)

    // ── Paso 4: Parámetros ────────────────────────────────────────────────────

    const paramValues: Record<string, unknown> = {}

    for (let i = 0; i < script.params.length; i++) {
      const param = script.params[i]!
      const value = await promptParam(param, i, paramsCount)
      if (value === null) {
        p.cancel('Hasta luego.')
        process.exit(0)
      }
      paramValues[param.name] = value
    }

    // ── Paso 5: Preview y confirmación ──────────────────────────────────────

    const cmdSpec = buildCommand(script, paramValues)

    p.note(`$ ${cmdSpec.display}`, 'Comando a ejecutar')

    const shouldRun = await p.confirm({
      message: '¿Ejecutar este comando?',
      initialValue: true,
    })

    if (p.isCancel(shouldRun) || !shouldRun) {
      p.log.warn('Ejecución cancelada.')
    } else {
      // ── Paso 6: Ejecución ──────────────────────────────────────────────────

      console.log('\n' + '─'.repeat(60) + '\n')

      const exitCode = await runCommand(cmdSpec.bin, cmdSpec.args, ROOT)

      console.log('\n' + '─'.repeat(60))

      if (exitCode === 0) {
        p.log.success('Script completado correctamente.')
      } else {
        p.log.error(`Script terminó con código de salida ${exitCode}.`)
      }
    }

    // ── Paso 7: Loop ─────────────────────────────────────────────────────────

    console.log('')
    const again = await p.confirm({
      message: '¿Ejecutar otro script?',
      initialValue: false,
    })

    if (p.isCancel(again) || !again) {
      continueRunning = false
    }
  }

  p.outro('¡Hasta luego!')
}

main().catch((err) => {
  p.log.error(String(err))
  process.exit(1)
})
