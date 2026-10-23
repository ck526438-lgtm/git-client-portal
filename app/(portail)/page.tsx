import Link from 'next/link'
import type { Metadata } from 'next'
import MilestoneRail from '@/components/milestone-rail'
import { Bar, Empty, Panel, Pill, Stat } from '@/components/ui'
import { getContent } from '@/lib/content'
import {
  deliverableLabel,
  deliverableTone,
  frDate,
  invoiceLabel,
  invoiceTone,
  money,
  projectStatusLabel,
  updateLabel,
  updateTone,
} from '@/lib/format'
import { mailtoLink } from '@/lib/mailto'

export async function generateMetadata(): Promise<Metadata> {
  const { project } = await getContent()
  return { title: `${project.title} — ${project.studio}`, description: project.summary }
}

export default async function DashboardPage() {
  const content = await getContent()
  const { project, stats } = content

  const pending = content.deliverables.filter((item) => item.status === 'review' || item.status === 'changes')
  const blockers = content.updates.filter((item) => item.kind === 'blocker').slice(0, 2)
  const overdue = content.invoices.filter((item) => item.is_overdue)

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            {project.client}
            {project.reference ? ` · ${project.reference}` : ''}
          </p>
          <h1>{project.title}</h1>
          {project.summary ? <p className="hero-summary">{project.summary}</p> : null}
          <div className="chips">
            <Pill tone={project.status === 'done' ? 'ok' : project.status === 'paused' ? 'warn' : 'info'}>
              {projectStatusLabel[project.status]}
            </Pill>
            {project.started_on ? <span className="pill" data-tone="neutral">Démarré le {frDate(project.started_on)}</span> : null}
            {project.target_on ? <span className="pill" data-tone="neutral">Objectif {frDate(project.target_on)}</span> : null}
            {project.contact ? <span className="pill" data-tone="neutral">Contact client : {project.contact}</span> : null}
          </div>
        </div>

        <div className="card card-pad">
          <div className="panel-title">
            <h2>Avancement global</h2>
            <span className="panel-note">
              {stats.milestones_done}/{stats.milestones_total} étapes
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
            <span style={{ fontSize: 42, fontWeight: 660, letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.overall}%</span>
            <span className="mono-note">{stats.next_milestone ? `prochaine échéance : ${stats.next_milestone.title}` : 'fin de projet'}</span>
          </div>
          <Bar value={stats.overall} tone={stats.overall >= 100 ? 'ok' : 'accent'} />
          {stats.next_milestone?.due ? (
            <p className="stop-when" style={{ marginLeft: 0, marginTop: 10 }}>
              {stats.next_milestone.title} attendu le {frDate(stats.next_milestone.due)}
            </p>
          ) : null}
          {project.email ? (
            <p style={{ marginTop: 16, marginBottom: 0 }}>
              <a className="btn" href={mailtoLink(project.email, `Question sur le dossier ${project.reference || project.title}`)}>
                Poser une question
              </a>
            </p>
          ) : null}
        </div>
      </section>

      {overdue.length > 0 ? (
        <div className="notice" style={{ marginTop: 26 }}>
          <span aria-hidden="true">•</span>
          <span>
            <strong>{overdue.length} facture{overdue.length > 1 ? 's' : ''} échue{overdue.length > 1 ? 's' : ''}.</strong>{' '}
            Total dû : {money(overdue.reduce((sum, item) => sum + item.total, 0), stats.currency)}. La prochaine étape démarre
            dès réception — <Link href="/factures">voir le détail</Link>.
          </span>
        </div>
      ) : null}

      <div className="stats" style={{ marginTop: 22 }}>
        <Stat label="Livrables" value={stats.deliverables_total} foot={`${stats.approved} validés`} />
        <Stat
          label="Votre avis attendu"
          value={stats.awaiting_review}
          foot={stats.awaiting_review > 0 ? 'à valider cette semaine' : 'rien en attente'}
        />
        <Stat label="Nouvelles" value={stats.updates_total} foot="journal du projet" />
        <Stat
          label="Restant à régler"
          value={money(stats.unpaid_total, stats.currency)}
          foot={`${stats.paid_total > 0 ? `${money(stats.paid_total, stats.currency)} encaissés` : 'aucun encaissement'}`}
        />
      </div>

      <div className="stack">
        <Panel
          title="Ce que nous attendons de vous"
          note={pending.length + blockers.length === 0 ? undefined : 'réponse utile pour tenir le planning'}
        >
          {pending.length === 0 && blockers.length === 0 ? (
            <Empty>Rien ne bloque de votre côté. Nous revenons vers vous dès qu'une décision est nécessaire.</Empty>
          ) : (
            <div className="list">
              {pending.map((item) => (
                <Link className="row" href={`/livrables/${item.slug}`} key={item.slug}>
                  <span className="row-date">{item.date ? frDate(item.date) : '—'}</span>
                  <span className="row-main">
                    <span className="row-title">
                      {item.title}
                      <Pill tone={deliverableTone[item.status]}>{deliverableLabel[item.status]}</Pill>
                    </span>
                    <span className="row-sub">{item.summary}</span>
                  </span>
                  <span className="row-side">Ouvrir</span>
                </Link>
              ))}
              {blockers.map((item) => (
                <Link className="row" href={`/activite/${item.slug}`} key={item.slug}>
                  <span className="row-date">{frDate(item.date)}</span>
                  <span className="row-main">
                    <span className="row-title">
                      {item.title}
                      <Pill tone={updateTone[item.kind]}>{updateLabel[item.kind]}</Pill>
                    </span>
                    <span className="row-sub">{item.summary}</span>
                  </span>
                  <span className="row-side">Détail</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Le chemin pris" note="étapes et échéances">
          <MilestoneRail items={content.milestones} />
        </Panel>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <Panel title="Qui travaille sur votre projet">
            <div className="people">
              {project.team.length === 0 ? <Empty>Équipe non renseignée.</Empty> : null}
              {project.team.map((member) => (
                <div className="person" key={member.name}>
                  <span className="avatar" aria-hidden="true">
                    {member.name.split(/\s+/).map((part) => part.slice(0, 1)).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    <span className="person-name">{member.name}</span>
                    <br />
                    <span className="person-role">{member.email ? <a href={`mailto:${member.email}`}>{member.role}</a> : member.role}</span>
                  </span>
                </div>
              ))}
            </div>
            {project.support.hours || project.support.note ? (
              <div className="kv" style={{ marginTop: 18 }}>
                {project.support.hours ? (
                  <div className="kv-row">
                    <span>Disponibilités</span>
                    <span>{project.support.hours}</span>
                  </div>
                ) : null}
                {project.support.note ? (
                  <div className="kv-row">
                    <span>Note</span>
                    <span>{project.support.note}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Panel>

          {project.links.length > 0 ? (
            <Panel title="Accès directs">
              <div className="kv">
                {project.links.map((link) => (
                  <div className="kv-row" key={link.url}>
                    <span>{link.kind ? linkKindLabel(link.kind) : 'Lien'}</span>
                    <a href={link.url} style={{ textDecoration: 'none', fontWeight: 550 }}>
                      {link.label}
                    </a>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      </div>

      <div className="stack">
        <Panel
          title="Dernières nouvelles"
          note="journal d'avancement"
          action={
            <Link className="btn ghost small" href="/activite" style={{ marginLeft: 'auto' }}>
              Tout l'historique
            </Link>
          }
        >
          {content.updates.length === 0 ? (
            <Empty>Première publication à venir.</Empty>
          ) : (
            <div className="list">
              {content.updates.slice(0, 3).map((item) => (
                <Link className="row" href={`/activite/${item.slug}`} key={item.slug}>
                  <span className="row-date">{frDate(item.date)}</span>
                  <span className="row-main">
                    <span className="row-title">
                      {item.title}
                      <Pill tone={updateTone[item.kind]}>{updateLabel[item.kind]}</Pill>
                    </span>
                    <span className="row-sub">{item.summary}</span>
                  </span>
                  <span className="row-side">Lire</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        {content.invoices.length > 0 ? (
          <Panel
            title="Facturation"
            note="document comptable"
            action={
              <Link className="btn ghost small" href="/factures" style={{ marginLeft: 'auto' }}>
                Détail
              </Link>
            }
          >
            <div className="list">
              {content.invoices.slice(0, 2).map((item) => (
                <Link className="row" href={`/factures/${item.slug}`} key={item.slug}>
                  <span className="row-date">{frDate(item.issued_on)}</span>
                  <span className="row-main">
                    <span className="row-title">
                      {item.number}
                      <Pill tone={invoiceTone(item)}>{invoiceLabel(item)}</Pill>
                    </span>
                    <span className="row-sub">
                      {item.reference || 'Prestation'} · échéance {frDate(item.due_on)}
                    </span>
                  </span>
                  <span className="row-side">
                    <strong>{money(item.total, item.currency)}</strong>
                    TTC
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        ) : null}
      </div>
    </>
  )
}

function linkKindLabel(kind: string): string {
  const map: Record<string, string> = { email: 'E-mail', web: 'Site', design: 'Design', document: 'Document' }
  return map[kind] || 'Lien'
}
