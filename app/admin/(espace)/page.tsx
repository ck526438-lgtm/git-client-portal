import Link from 'next/link'
import { Icon } from '@/components/icons'
import { Pill } from '@/components/ui'
import { loadEntries, loadMilestones } from '@/lib/admin/content'
import { getStore } from '@/lib/admin/store'
import { deliverableLabel, deliverableTone, frDate, invoiceLabel, invoiceTone, money } from '@/lib/format'

export default async function AdminHome() {
  const store = getStore()
  if (!store) return null

  const [updates, deliverables, invoices, planning] = await Promise.all([
    loadEntries(store, 'updates'),
    loadEntries(store, 'deliverables'),
    loadEntries(store, 'invoices'),
    loadMilestones(store),
  ])

  const toReview = deliverables.filter((entry) => entry.item && (entry.item.status === 'review' || entry.item.status === 'changes'))
  const unpaid = invoices.filter((entry) => entry.item && entry.item.status === 'unpaid')
  const errors = [...updates, ...deliverables, ...invoices].filter((entry) => entry.error)
  const lastUpdate = updates
    .map((entry) => entry.item)
    .filter(Boolean)
    .sort((a, b) => (a!.date < b!.date ? 1 : -1))[0]
  const overall = planning.items.length
    ? Math.round(planning.items.reduce((sum, item) => sum + item.progress, 0) / planning.items.length)
    : 0

  return (
    <>
      <header className="detail-head">
        <p className="eyebrow">Éditeur</p>
        <h1>Que voulez-vous publier ?</h1>
      </header>

      <div className="quick-grid">
        <Link className="quick" href="/admin/nouvelles/nouveau">
          <span className="round-btn" aria-hidden="true">
            <Icon name="activity" />
          </span>
          <strong>Publier une nouvelle</strong>
          <span>Avancement, décision, blocage, livraison</span>
        </Link>
        <Link className="quick" href="/admin/livrables/nouveau">
          <span className="round-btn" aria-hidden="true">
            <Icon name="layers" />
          </span>
          <strong>Ajouter un livrable</strong>
          <span>Maquette, document, lien à valider</span>
        </Link>
        <Link className="quick" href="/admin/factures/nouveau">
          <span className="round-btn" aria-hidden="true">
            <Icon name="receipt" />
          </span>
          <strong>Créer une facture</strong>
          <span>Totaux et TVA calculés automatiquement</span>
        </Link>
        <Link className="quick" href="/admin/planning">
          <span className="round-btn" aria-hidden="true">
            <Icon name="calendar" />
          </span>
          <strong>Mettre à jour le planning</strong>
          <span>{overall} % d’avancement global</span>
        </Link>
      </div>

      {errors.length > 0 ? (
        <div className="alert" data-tone="bad" style={{ marginTop: 22 }}>
          <strong>{errors.length} fichier(s) contiennent une erreur</strong> et bloqueront la mise à jour du portail :{' '}
          {errors.map((entry) => entry.file).join(', ')}. Ouvrez-les dans l’éditeur pour les corriger.
        </div>
      ) : null}

      <div className="stats" style={{ marginTop: 22 }}>
        <div className="stat">
          <div className="stat-label">Dernière nouvelle</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{lastUpdate ? frDate(lastUpdate.date) : '—'}</div>
          <div className="stat-foot">{lastUpdate?.title ?? 'Aucune publication'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Livrables</div>
          <div className="stat-value">{deliverables.length}</div>
          <div className="stat-foot">{toReview.length} en attente du client</div>
        </div>
        <div className="stat">
          <div className="stat-label">À encaisser</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {money(unpaid.reduce((sum, entry) => sum + (entry.item?.total ?? 0), 0), unpaid[0]?.item?.currency || 'EUR')}
          </div>
          <div className="stat-foot">{unpaid.length} facture(s) non réglée(s)</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="card card-pad">
          <div className="panel-title">
            <h2>Chez le client</h2>
            <span className="panel-note">avis attendu</span>
          </div>
          {toReview.length === 0 ? (
            <div className="empty">Aucun livrable en attente.</div>
          ) : (
            <div className="list">
              {toReview.map((entry) => (
                <Link className="row admin-row compact" href={`/admin/livrables/${entry.slug}`} key={entry.slug}>
                  <span className="row-main">
                    <span className="row-title">
                      {entry.item!.title}
                      <Pill tone={deliverableTone[entry.item!.status]}>{deliverableLabel[entry.item!.status]}</Pill>
                    </span>
                  </span>
                  <span className="row-side">Modifier</span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card card-pad">
          <div className="panel-title">
            <h2>Factures à suivre</h2>
          </div>
          {unpaid.length === 0 ? (
            <div className="empty">Tout est réglé.</div>
          ) : (
            <div className="list">
              {unpaid.map((entry) => (
                <Link className="row admin-row compact" href={`/admin/factures/${entry.slug}`} key={entry.slug}>
                  <span className="row-main">
                    <span className="row-title">
                      {entry.item!.number}
                      <Pill tone={invoiceTone(entry.item!)}>{invoiceLabel(entry.item!)}</Pill>
                    </span>
                    <span className="row-sub">échéance {frDate(entry.item!.due_on)}</span>
                  </span>
                  <span className="row-side">
                    <strong>{money(entry.item!.total, entry.item!.currency)}</strong>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
