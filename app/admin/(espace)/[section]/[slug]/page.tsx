import Link from 'next/link'
import { notFound } from 'next/navigation'
import { saveEntryAction } from '@/app/admin/actions'
import AdminForm from '@/components/admin/admin-form'
import InvoiceLines from '@/components/admin/invoice-lines'
import RowsEditor from '@/components/admin/rows-editor'
import { KIND_LABEL, loadEntries, loadEntry, loadMilestones, type Kind } from '@/lib/admin/content'
import { SECTIONS } from '@/lib/admin/sections'
import { getStore } from '@/lib/admin/store'
import { deliverableLabel, updateLabel } from '@/lib/format'

interface Props {
  params: Promise<{ section: string; slug: string }>
}

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)

function nextNumber(numbers: string[]): string {
  const year = new Date().getFullYear()
  const last = numbers.sort().at(-1)
  if (!last) return `FA-${year}-001`
  const match = /^(.*?)(\d+)$/.exec(last)
  if (!match) return `${last}-2`
  return `${match[1]}${String(Number(match[2]) + 1).padStart(match[2].length, '0')}`
}

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`form-field${wide ? ' wide' : ''}`}>
      <span className="form-label">{label}</span>
      {children}
      {hint ? <span className="form-hint">{hint}</span> : null}
    </label>
  )
}

export default async function EditPage({ params }: Props) {
  const { section, slug } = await params
  const kind: Kind | undefined = SECTIONS[section]
  if (!kind) notFound()
  const store = getStore()
  if (!store) return null

  const isNew = slug === 'nouveau'
  const entry = isNew ? null : await loadEntry(store, kind, slug)
  if (!isNew && !entry) notFound()
  const data = (entry?.data ?? {}) as Record<string, any>
  const { items: milestones } = await loadMilestones(store)
  const label = KIND_LABEL[kind]

  const milestoneSelect = (
    <Field label="Étape du planning" hint="Facultatif : relie la publication à une étape.">
      <select name="milestone" defaultValue={String(data.milestone ?? '')}>
        <option value="">— Aucune —</option>
        {milestones.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
    </Field>
  )

  let fields: React.ReactNode = null

  if (kind === 'updates') {
    fields = (
      <div className="form-grid">
        <Field label="Titre" wide>
          <input name="title" required maxLength={160} defaultValue={data.title ?? ''} placeholder="Les maquettes de la page d’accueil sont prêtes" />
        </Field>
        <Field label="Date">
          <input name="date" type="date" required defaultValue={String(data.date ?? today()).slice(0, 10)} />
        </Field>
        <Field label="Type">
          <select name="kind" defaultValue={data.kind ?? 'progress'}>
            {Object.entries(updateLabel).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </Field>
        {milestoneSelect}
        <Field label="Résumé" hint="Une phrase affichée dans les listes (300 caractères max)." wide>
          <input name="summary" maxLength={300} defaultValue={data.summary ?? ''} />
        </Field>
      </div>
    )
  } else if (kind === 'deliverables') {
    fields = (
      <div className="form-grid">
        <Field label="Titre" wide>
          <input name="title" required maxLength={160} defaultValue={data.title ?? ''} placeholder="Maquette de la fiche produit" />
        </Field>
        <Field label="Statut">
          <select name="status" defaultValue={data.status ?? 'review'}>
            {Object.entries(deliverableLabel).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" hint="maquette, document, rapport…">
          <input name="kind" maxLength={40} defaultValue={data.kind ?? ''} placeholder="maquette" />
        </Field>
        <Field label="Version">
          <input name="version" maxLength={20} defaultValue={data.version ?? 'v1'} />
        </Field>
        <Field label="Date">
          <input name="date" type="date" defaultValue={String(data.date ?? today()).slice(0, 10)} />
        </Field>
        {milestoneSelect}
        <Field label="Résumé" wide>
          <input name="summary" maxLength={300} defaultValue={data.summary ?? ''} />
        </Field>
        <div className="form-field wide">
          <span className="form-label">Fichiers et liens</span>
          <RowsEditor
            name="files"
            addLabel="Ajouter un lien"
            initial={Array.isArray(data.files) ? data.files.map((file: any) => (typeof file === 'string' ? { label: 'Document', url: file } : file)) : []}
            columns={[
              { name: 'label', label: 'Libellé', placeholder: 'Maquette Figma' },
              { name: 'url', label: 'Adresse (https://…)', type: 'url', placeholder: 'https://', width: 'minmax(0, 2fr)' },
              { name: 'kind', label: 'Type', placeholder: 'figma, pdf…', width: '120px' },
            ]}
          />
          <span className="form-hint">Hébergez les fichiers sur Drive, Dropbox, Figma… et collez le lien de partage.</span>
        </div>
      </div>
    )
  } else {
    const others = isNew ? await loadEntries(store, 'invoices') : []
    const last = others.map((other) => other.item).filter(Boolean).sort((a, b) => (a!.issued_on < b!.issued_on ? 1 : -1))[0]
    const lines = Array.isArray(data.lines)
      ? data.lines.map((line: any) => ({ label: line.label ?? '', quantity: line.quantity ?? 1, unit_price: line.unit_price ?? '' }))
      : []
    fields = (
      <div className="form-grid">
        <Field label="Numéro">
          <input
            name="number"
            required
            maxLength={40}
            defaultValue={data.number ?? nextNumber(others.map((other) => String(other.data.number ?? '')).filter(Boolean))}
          />
        </Field>
        <Field label="Statut">
          <select name="status" defaultValue={data.status ?? 'unpaid'}>
            <option value="draft">Brouillon (masquée du total dû)</option>
            <option value="unpaid">À régler</option>
            <option value="paid">Payée</option>
          </select>
        </Field>
        <Field label="Objet">
          <input name="reference" maxLength={60} defaultValue={data.reference ?? ''} placeholder="Acompte design" />
        </Field>
        <Field label="Émise le">
          <input name="issued_on" type="date" required defaultValue={String(data.issued_on ?? today()).slice(0, 10)} />
        </Field>
        <Field label="À régler avant le">
          <input name="due_on" type="date" required defaultValue={String(data.due_on ?? inDays(30)).slice(0, 10)} />
        </Field>
        <Field label="Payée le" hint="Rempli automatiquement si vide.">
          <input name="paid_on" type="date" defaultValue={data.paid_on ? String(data.paid_on).slice(0, 10) : ''} />
        </Field>
        <Field label="Devise" hint="EUR, XOF, USD…">
          <input name="currency" maxLength={8} defaultValue={data.currency ?? last?.currency ?? 'EUR'} />
        </Field>
        <Field label="TVA (%)" hint="0 si non applicable.">
          <input name="tax_rate" type="number" min={0} max={100} step="any" defaultValue={data.tax_rate ?? last?.tax_rate ?? 20} />
        </Field>
        <div className="form-field wide">
          <span className="form-label">Lignes</span>
          <InvoiceLines initial={lines.length ? lines : [{ label: '', quantity: 1, unit_price: '' }]} />
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="detail-head admin-head">
        <div>
          <Link className="backlink" href={`/admin/${section}`}>
            ← {label.many}
          </Link>
          <h1>{isNew ? `Nouvelle ${label.one === 'livrable' ? 'entrée' : label.one}` : String(data.title ?? data.number ?? slug)}</h1>
        </div>
      </header>

      {entry?.error ? (
        <div className="alert" data-tone="bad" style={{ marginBottom: 18 }}>
          Ce fichier contient une erreur qui bloque la mise à jour du portail : {entry.error}. Corrigez le champ concerné
          puis enregistrez.
        </div>
      ) : null}

      <section className="card card-pad">
        <AdminForm action={saveEntryAction} submitLabel={isNew ? 'Publier' : 'Enregistrer'} pendingLabel="Publication…">
          <input type="hidden" name="kindName" value={kind} />
          <input type="hidden" name="slug" value={isNew ? '' : slug} />
          <input type="hidden" name="sha" value={entry?.sha ?? ''} />
          {fields}
          <label className="form-field wide" style={{ marginTop: 18 }}>
            <span className="form-label">{kind === 'invoices' ? 'Note en bas de facture' : 'Texte'}</span>
            <textarea name="body" rows={kind === 'invoices' ? 4 : 10} defaultValue={entry?.body ?? ''} />
            <span className="form-hint">
              Mise en forme simple : **gras**, *italique*, listes avec « - », titres avec « ## », liens [texte](https://…).
            </span>
          </label>
        </AdminForm>
      </section>
    </>
  )
}
