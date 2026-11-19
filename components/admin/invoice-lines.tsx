'use client'

import RowsEditor from './rows-editor'

function total(rows: Record<string, string>[]) {
  return rows.reduce((sum, row) => {
    const quantity = Number(String(row.quantity || '1').replace(',', '.')) || 0
    const unit = Number(String(row.unit_price || '0').replace(/\s/g, '').replace(',', '.')) || 0
    return sum + quantity * unit
  }, 0)
}

export default function InvoiceLines({ initial }: { initial: Record<string, string | number>[] }) {
  return (
    <RowsEditor
      name="lines"
      addLabel="Ajouter une ligne"
      empty={{ quantity: 1 }}
      initial={initial}
      columns={[
        { name: 'label', label: 'Prestation', placeholder: 'Maquettes de la page d’accueil', width: 'minmax(0, 3fr)' },
        { name: 'quantity', label: 'Qté', type: 'number', step: 'any', width: '80px' },
        { name: 'unit_price', label: 'Prix unitaire HT', type: 'number', step: 'any', width: '150px' },
      ]}
      footer={(rows) => (
        <p className="mono-note lines-total">
          Total HT : <strong>{total(rows).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong> — la TVA et le TTC
          sont calculés par le portail.
        </p>
      )}
    />
  )
}
