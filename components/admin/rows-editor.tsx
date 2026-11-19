'use client'

import { useState } from 'react'

export interface Column {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'url' | 'email' | 'select' | 'range'
  options?: { value: string; label: string }[]
  placeholder?: string
  width?: string
  step?: string
}

interface Props {
  name: string
  columns: Column[]
  initial: Record<string, string | number>[]
  addLabel: string
  empty?: Record<string, string | number>
  reorder?: boolean
  footer?: (rows: Record<string, string>[]) => React.ReactNode
}

/** Tableau de lignes éditables, sérialisé en JSON dans un champ caché. */
export default function RowsEditor({ name, columns, initial, addLabel, empty, reorder = false, footer }: Props) {
  const blank = () =>
    Object.fromEntries(columns.map((column) => [column.name, String(empty?.[column.name] ?? '')])) as Record<string, string>
  const [rows, setRows] = useState<Record<string, string>[]>(() =>
    initial.length ? initial.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? '')]))) : [],
  )

  const update = (index: number, key: string, value: string) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  const move = (index: number, delta: number) =>
    setRows((current) => {
      const next = [...current]
      const target = index + delta
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const template = `${columns.map((column) => column.width || 'minmax(0, 1fr)').join(' ')} auto`

  return (
    <div className="rows-editor">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.length > 0 ? (
        <div className="rows-head" style={{ gridTemplateColumns: template }} aria-hidden="true">
          {columns.map((column) => (
            <span key={column.name}>{column.label}</span>
          ))}
          <span />
        </div>
      ) : null}
      {rows.map((row, index) => (
        <div className="rows-line" key={index} style={{ gridTemplateColumns: template }}>
          {columns.map((column) =>
            column.type === 'select' ? (
              <select
                key={column.name}
                aria-label={column.label}
                value={row[column.name] ?? ''}
                onChange={(event) => update(index, column.name, event.target.value)}
              >
                {column.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                key={column.name}
                aria-label={column.label}
                type={column.type === 'range' ? 'number' : column.type || 'text'}
                min={column.type === 'range' ? 0 : undefined}
                max={column.type === 'range' ? 100 : undefined}
                step={column.step}
                inputMode={column.type === 'number' || column.type === 'range' ? 'decimal' : undefined}
                placeholder={column.placeholder ?? column.label}
                value={row[column.name] ?? ''}
                onChange={(event) => update(index, column.name, event.target.value)}
              />
            ),
          )}
          <span className="rows-tools">
            {reorder ? (
              <>
                <button type="button" className="mini" onClick={() => move(index, -1)} aria-label="Monter" disabled={index === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  className="mini"
                  onClick={() => move(index, 1)}
                  aria-label="Descendre"
                  disabled={index === rows.length - 1}
                >
                  ↓
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="mini"
              onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              aria-label="Retirer la ligne"
            >
              ×
            </button>
          </span>
        </div>
      ))}
      <button type="button" className="btn ghost add-row" onClick={() => setRows((current) => [...current, blank()])}>
        + {addLabel}
      </button>
      {footer ? footer(rows) : null}
    </div>
  )
}
