import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Markdown from '@/components/markdown'
import PrintButton from '@/components/print-button'
import { Pill } from '@/components/ui'
import { getContent } from '@/lib/content'
import { frDate, invoiceLabel, invoiceTone, money } from '@/lib/format'
import { mailtoLink } from '@/lib/mailto'

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const content = await getContent()
  return content.invoices.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const content = await getContent()
  const item = content.invoices.find((entry) => entry.slug === slug)
  return { title: item ? `Facture ${item.number} — ${content.project.studio}` : 'Facture introuvable' }
}

export default async function InvoicePage({ params }: Params) {
  const { slug } = await params
  const content = await getContent()
  const item = content.invoices.find((entry) => entry.slug === slug)
  if (!item) notFound()

  const { project } = content

  return (
    <>
      <header className="detail-head no-print">
        <Link className="backlink" href="/factures">
          ← Facturation
        </Link>
        <div className="chips" style={{ marginTop: 18 }}>
          <Pill tone={invoiceTone(item)}>{invoiceLabel(item)}</Pill>
          {item.reference ? <span className="pill" data-tone="neutral">{item.reference}</span> : null}
        </div>
      </header>

      <section className="invoice-sheet" style={{ marginTop: 24 }}>
        <div className="invoice-top">
          <div>
            <h2 style={{ fontSize: 21 }}>{project.studio}</h2>
            {project.billing.legal ? <p className="mono-note" style={{ margin: '6px 0 0' }}>{project.billing.legal}</p> : null}
            {project.billing.vat ? <p className="mono-note" style={{ margin: '2px 0 0' }}>{project.billing.vat}</p> : null}
            {project.email ? <p className="mono-note" style={{ margin: '2px 0 0' }}>{project.email}</p> : null}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="eyebrow" style={{ margin: 0 }}>Facture</p>
            <h3 style={{ fontSize: 17 }}>{item.number}</h3>
            <p className="mono-note" style={{ margin: '6px 0 0' }}>Émise le {frDate(item.issued_on)}</p>
            <p className="mono-note" style={{ margin: '2px 0 0' }}>À régler avant le {frDate(item.due_on)}</p>
            {item.paid_on ? <p className="mono-note" style={{ margin: '2px 0 0', color: 'var(--ok)' }}>Réglée le {frDate(item.paid_on)}</p> : null}
          </div>
        </div>

        <div className="invoice-top" style={{ borderBottom: 0, paddingBottom: 6 }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Client</p>
            <h3 style={{ fontSize: 16, marginTop: 5 }}>{project.client}</h3>
            {project.contact ? <p className="mono-note" style={{ margin: '3px 0 0' }}>À l'attention de {project.contact}</p> : null}
            {project.reference ? <p className="mono-note" style={{ margin: '3px 0 0' }}>Dossier {project.reference}</p> : null}
          </div>
        </div>

        <table className="invoice-lines">
          <thead>
            <tr>
              <th>Prestation</th>
              <th className="num">Qté</th>
              <th className="num">P.U. HT</th>
              <th className="num">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {item.lines.length > 0 ? (
              item.lines.map((line) => (
                <tr key={line.label}>
                  <td>{line.label}</td>
                  <td className="num">{line.quantity}</td>
                  <td className="num">{money(line.unit_price, item.currency)}</td>
                  <td className="num">{money(line.total, item.currency)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>{item.reference || 'Prestation'}</td>
                <td className="num">1</td>
                <td className="num">{money(item.subtotal, item.currency)}</td>
                <td className="num">{money(item.subtotal, item.currency)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="invoice-totals">
          <div>
            <span>Total HT</span>
            <span>{money(item.subtotal, item.currency)}</span>
          </div>
          <div>
            <span>TVA {item.tax_rate} %</span>
            <span>{money(item.tax, item.currency)}</span>
          </div>
          <div className="grand">
            <span>Total TTC</span>
            <span>{money(item.total, item.currency)}</span>
          </div>
        </div>

        <Markdown source={item.body} />

        <div style={{ borderTop: '1px solid var(--line)', marginTop: 24, paddingTop: 16 }} className="mono-note">
          {project.billing.iban ? <p style={{ margin: '0 0 4px' }}>IBAN {project.billing.iban}</p> : null}
          {project.billing.terms ? <p style={{ margin: '0 0 4px' }}>{project.billing.terms}</p> : null}
          {project.billing.penalty ? <p style={{ margin: 0 }}>{project.billing.penalty}</p> : null}
        </div>
      </section>

      <div className="chips no-print" style={{ marginTop: 26 }}>
        <PrintButton />
        {project.email ? (
          <a
            className="btn"
            href={mailtoLink(project.email, `Facture ${item.number}`, "Bonjour,\n\nConcernant la facture citée en objet :\n")}
          >
            Écrire au service facturation
          </a>
        ) : null}
      </div>
    </>
  )
}
