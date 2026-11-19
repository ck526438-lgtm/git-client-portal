import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteEntryAction, markPaidAction } from '@/app/admin/actions'
import AdminForm from '@/components/admin/admin-form'
import { Pill } from '@/components/ui'
import { KIND_LABEL, loadEntries, type Kind, type Loaded } from '@/lib/admin/content'
import { SECTIONS } from '@/lib/admin/sections'
import { getStore } from '@/lib/admin/store'
import {
  deliverableLabel,
  deliverableTone,
  frDate,
  invoiceLabel,
  invoiceTone,
  money,
  updateLabel,
  updateTone,
} from '@/lib/format'
import type { Deliverable, Invoice, UpdateEntry } from '@/lib/types'

interface Props {
  params: Promise<{ section: string }>
  searchParams: Promise<{ ok?: string; supprime?: string }>
}

function sortKey(kind: Kind, entry: Loaded<Kind>): string {
  if (!entry.item) return '9999'
  if (kind === 'invoices') return (entry.item as Invoice).issued_on
  return (entry.item as UpdateEntry | Deliverable).date || ''
}

export default async function ListPage({ params, searchParams }: Props) {
  const { section } = await params
  const { ok, supprime } = await searchParams
  const kind = SECTIONS[section]
  if (!kind) notFound()
  const store = getStore()
  if (!store) return null

  const label = KIND_LABEL[kind]
  const entries = (await loadEntries(store, kind)).sort((a, b) => (sortKey(kind, a) < sortKey(kind, b) ? 1 : -1))

  return (
    <>
      <header className="detail-head admin-head">
        <div>
          <p className="eyebrow">Éditeur</p>
          <h1>{label.many}</h1>
        </div>
        <Link className="btn primary" href={`/admin/${section}/nouveau`}>
          + {kind === 'invoices' ? 'Nouvelle facture' : kind === 'updates' ? 'Nouvelle publication' : 'Nouveau livrable'}
        </Link>
      </header>

      {ok ? (
        <div className="alert" data-tone="info" role="status" style={{ marginBottom: 18 }}>
          Enregistré. {store.mode === 'github' ? 'Le portail sera à jour dans une minute environ.' : 'Visible tout de suite sur le portail.'}
        </div>
      ) : null}
      {supprime ? (
        <div className="alert" data-tone="info" role="status" style={{ marginBottom: 18 }}>
          Supprimé.
        </div>
      ) : null}

      {entries.length === 0 ? (
        <div className="empty card card-pad">Rien pour l’instant. Créez votre première {label.one}.</div>
      ) : (
        <div className="list">
          {entries.map((entry) => (
            <div className="row admin-row" key={entry.slug}>
              <span className="row-date">{sortKey(kind, entry) && entry.item ? frDate(sortKey(kind, entry)) : '—'}</span>
              <span className="row-main">
                <span className="row-title">
                  <Link href={`/admin/${section}/${entry.slug}`}>
                    {entry.item ? ('number' in entry.item ? entry.item.number : entry.item.title) : entry.file}
                  </Link>
                  {entry.error ? <Pill tone="bad">Erreur</Pill> : null}
                  {entry.item && kind === 'updates' ? (
                    <Pill tone={updateTone[(entry.item as UpdateEntry).kind]}>{updateLabel[(entry.item as UpdateEntry).kind]}</Pill>
                  ) : null}
                  {entry.item && kind === 'deliverables' ? (
                    <Pill tone={deliverableTone[(entry.item as Deliverable).status]}>
                      {deliverableLabel[(entry.item as Deliverable).status]}
                    </Pill>
                  ) : null}
                  {entry.item && kind === 'invoices' ? (
                    <Pill tone={invoiceTone(entry.item as Invoice)}>{invoiceLabel(entry.item as Invoice)}</Pill>
                  ) : null}
                </span>
                <span className="row-sub">
                  {entry.error ||
                    (kind === 'invoices'
                      ? `${(entry.item as Invoice).reference || 'Prestation'} · ${money((entry.item as Invoice).total, (entry.item as Invoice).currency)} TTC`
                      : (entry.item as UpdateEntry | Deliverable).summary)}
                </span>
              </span>
              <span className="row-side admin-actions">
                {kind === 'invoices' && entry.item && (entry.item as Invoice).status === 'unpaid' ? (
                  <AdminForm action={markPaidAction} submitLabel="Marquer payée" pendingLabel="…" tone="ghost" inline>
                    <input type="hidden" name="slug" value={entry.slug} />
                  </AdminForm>
                ) : null}
                <Link className="btn ghost" href={`/admin/${section}/${entry.slug}`}>
                  Modifier
                </Link>
                <AdminForm
                  action={deleteEntryAction}
                  submitLabel="Supprimer"
                  pendingLabel="…"
                  tone="ghost"
                  inline
                  confirm={`Supprimer définitivement « ${entry.slug} » ? Il restera récupérable dans l’historique Git.`}
                >
                  <input type="hidden" name="kindName" value={kind} />
                  <input type="hidden" name="slug" value={entry.slug} />
                  <input type="hidden" name="sha" value={entry.sha} />
                </AdminForm>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
