import Link from 'next/link'
import type { Metadata } from 'next'
import { Empty, Pill, Stat } from '@/components/ui'
import { getContent } from '@/lib/content'
import { frDate, invoiceLabel, invoiceTone, money } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  const { project } = await getContent()
  return { title: `Factures — ${project.studio}` }
}

export default async function InvoicesPage() {
  const content = await getContent()
  const { stats } = content

  return (
    <>
      <header className="detail-head" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Facturation</p>
        <h1>Factures et règlements</h1>
        <p className="hero-summary">
          Les montants sont affichés en TTC. Les factures téléchargeables au format imprimable portent la même valeur
          que le document comptable reçu par e-mail.
        </p>
      </header>

      {content.invoices.length === 0 ? (
        <div className="stack">
          <Empty>Aucune facture émise à ce jour.</Empty>
        </div>
      ) : (
        <>
          <div className="stats" style={{ marginTop: 26 }}>
            <Stat
              label="Facturé"
              value={money(content.invoices.reduce((sum, item) => sum + item.total, 0), stats.currency)}
              foot={`${content.invoices.length} facture${content.invoices.length > 1 ? 's' : ''}`}
            />
            <Stat label="Encaissé" value={money(stats.paid_total, stats.currency)} foot="règlements reçus" />
            <Stat
              label="À régler"
              value={money(stats.unpaid_total, stats.currency)}
              foot={stats.overdue_count > 0 ? `${stats.overdue_count} en retard` : 'dans les délais'}
            />
          </div>

          <div className="stack">
            <div className="list">
              {content.invoices.map((item) => (
                <Link className="row" href={`/factures/${item.slug}`} key={item.slug}>
                  <span className="row-date">{frDate(item.issued_on)}</span>
                  <span className="row-main">
                    <span className="row-title">
                      {item.number}
                      <Pill tone={invoiceTone(item)}>{invoiceLabel(item)}</Pill>
                    </span>
                    <span className="row-sub">
                      {item.reference || `${item.lines.length} ligne${item.lines.length > 1 ? 's' : ''} de prestation`} ·
                      échéance {frDate(item.due_on)}
                    </span>
                  </span>
                  <span className="row-side">
                    <strong>{money(item.total, item.currency)}</strong>
                    {item.status === 'paid' ? `réglée le ${frDate(item.paid_on)}` : 'TTC'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
