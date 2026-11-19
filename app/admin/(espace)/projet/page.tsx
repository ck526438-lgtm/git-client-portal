import { saveProjectAction } from '@/app/admin/actions'
import AdminForm from '@/components/admin/admin-form'
import RowsEditor from '@/components/admin/rows-editor'
import { loadProject } from '@/lib/admin/content'
import { getStore } from '@/lib/admin/store'
import { projectStatusLabel } from '@/lib/format'

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`form-field${wide ? ' wide' : ''}`}>
      <span className="form-label">{label}</span>
      {children}
      {hint ? <span className="form-hint">{hint}</span> : null}
    </label>
  )
}

const date = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value).slice(0, 10) : '')

export default async function ProjectPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams
  const store = getStore()
  if (!store) return null
  const { raw } = await loadProject(store)
  const branding = raw.branding ?? {}
  const project = raw.project ?? raw
  const billing = raw.billing ?? {}
  const support = raw.support ?? {}

  return (
    <>
      <header className="detail-head">
        <p className="eyebrow">Éditeur</p>
        <h1>Projet et marque</h1>
      </header>
      {ok ? (
        <div className="alert" data-tone="info" role="status" style={{ marginBottom: 18 }}>
          Informations enregistrées.
        </div>
      ) : null}
      <section className="card card-pad">
        <AdminForm action={saveProjectAction} submitLabel="Enregistrer">
          <h2 className="form-section">Votre marque</h2>
          <div className="form-grid">
            <Field label="Studio">
              <input name="studio" required defaultValue={branding.studio ?? ''} />
            </Field>
            <Field label="Accroche">
              <input name="tagline" maxLength={120} defaultValue={branding.tagline ?? ''} />
            </Field>
            <Field label="Couleur">
              <input name="accent" type="color" defaultValue={branding.accent ?? '#4f46e5'} />
            </Field>
            <Field label="Image de fond de l’accueil" hint="Lien https:// vers une image (facultatif)." wide>
              <input name="cover" type="url" defaultValue={branding.cover ?? ''} placeholder="https://" />
            </Field>
            <Field label="E-mail de contact">
              <input name="email" type="email" defaultValue={raw.contact?.email ?? ''} />
            </Field>
            <Field label="Disponibilités">
              <input name="hours" maxLength={120} defaultValue={support.hours ?? ''} />
            </Field>
            <Field label="Note de support">
              <input name="note" maxLength={300} defaultValue={support.note ?? ''} />
            </Field>
          </div>

          <h2 className="form-section">Le projet</h2>
          <div className="form-grid">
            <Field label="Titre du projet" wide>
              <input name="title" required defaultValue={project.title ?? ''} />
            </Field>
            <Field label="Client">
              <input name="client" required defaultValue={project.client ?? ''} />
            </Field>
            <Field label="Interlocuteur">
              <input name="contact" maxLength={80} defaultValue={project.contact ?? ''} />
            </Field>
            <Field label="Référence du dossier">
              <input name="reference" maxLength={40} defaultValue={project.reference ?? ''} />
            </Field>
            <Field label="Début">
              <input name="started_on" type="date" defaultValue={date(project.started_on)} />
            </Field>
            <Field label="Livraison visée">
              <input name="target_on" type="date" defaultValue={date(project.target_on)} />
            </Field>
            <Field label="État">
              <select name="status" defaultValue={raw.status ?? 'active'}>
                {Object.entries(projectStatusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Résumé" wide>
              <textarea name="summary" rows={3} maxLength={600} defaultValue={project.summary ?? ''} />
            </Field>
          </div>

          <h2 className="form-section">Équipe</h2>
          <RowsEditor
            name="team"
            addLabel="Ajouter une personne"
            initial={(raw.team ?? []).map((member: any) => ({ name: member.name ?? '', role: member.role ?? '', email: member.email ?? '' }))}
            columns={[
              { name: 'name', label: 'Nom' },
              { name: 'role', label: 'Rôle' },
              { name: 'email', label: 'E-mail (facultatif)', type: 'email' },
            ]}
          />

          <h2 className="form-section">Accès directs</h2>
          <RowsEditor
            name="links"
            addLabel="Ajouter un lien"
            initial={(raw.links ?? []).map((link: any) => ({ label: link.label ?? '', url: link.url ?? '', kind: link.kind ?? '' }))}
            columns={[
              { name: 'label', label: 'Libellé' },
              { name: 'url', label: 'Adresse', placeholder: 'https:// ou mailto:', width: 'minmax(0, 2fr)' },
              { name: 'kind', label: 'Type', placeholder: 'web, email…', width: '120px' },
            ]}
          />

          <h2 className="form-section">Facturation</h2>
          <div className="form-grid">
            <Field label="Mentions légales" wide>
              <input name="legal" maxLength={160} defaultValue={billing.legal ?? ''} placeholder="SARL Mon Studio · RCCM CI-ABJ-…" />
            </Field>
            <Field label="N° de TVA / compte contribuable">
              <input name="vat" maxLength={40} defaultValue={billing.vat ?? ''} />
            </Field>
            <Field label="IBAN / coordonnées de paiement">
              <input name="iban" maxLength={40} defaultValue={billing.iban ?? ''} />
            </Field>
            <Field label="Conditions de règlement" wide>
              <input name="terms" maxLength={200} defaultValue={billing.terms ?? ''} />
            </Field>
            <Field label="Pénalités de retard" wide>
              <input name="penalty" maxLength={200} defaultValue={billing.penalty ?? ''} />
            </Field>
          </div>
        </AdminForm>
      </section>
    </>
  )
}
