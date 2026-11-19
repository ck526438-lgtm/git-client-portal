import { saveMilestonesAction } from '@/app/admin/actions'
import AdminForm from '@/components/admin/admin-form'
import RowsEditor from '@/components/admin/rows-editor'
import { loadMilestones } from '@/lib/admin/content'
import { getStore } from '@/lib/admin/store'
import { milestoneLabel } from '@/lib/format'

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams
  const store = getStore()
  if (!store) return null
  const { items, sha, error } = await loadMilestones(store)

  return (
    <>
      <header className="detail-head">
        <p className="eyebrow">Éditeur</p>
        <h1>Planning</h1>
        <p className="hero-summary">
          L’avancement global affiché au client est la moyenne des pourcentages. Une étape « Terminée » compte toujours pour 100 %.
        </p>
      </header>
      {ok ? (
        <div className="alert" data-tone="info" role="status" style={{ marginBottom: 18 }}>
          Planning enregistré.
        </div>
      ) : null}
      {error ? (
        <div className="alert" data-tone="bad" style={{ marginBottom: 18 }}>
          Le planning actuel contient une erreur : {error}. Enregistrer ce formulaire le remplacera.
        </div>
      ) : null}
      <section className="card card-pad">
        <AdminForm action={saveMilestonesAction} submitLabel="Enregistrer le planning">
          <input type="hidden" name="sha" value={sha} />
          <RowsEditor
            name="milestones"
            addLabel="Ajouter une étape"
            reorder
            empty={{ status: 'planned', progress: 0 }}
            initial={items.map((item) => ({
              id: item.id,
              title: item.title,
              status: item.status,
              progress: item.progress,
              start: item.start,
              due: item.due,
              summary: item.summary,
            }))}
            columns={[
              { name: 'title', label: 'Étape', placeholder: 'Design', width: 'minmax(0, 2fr)' },
              {
                name: 'status',
                label: 'Statut',
                type: 'select',
                width: '130px',
                options: Object.entries(milestoneLabel).map(([value, label]) => ({ value, label })),
              },
              { name: 'progress', label: '%', type: 'range', width: '76px' },
              { name: 'start', label: 'Début', type: 'date', width: '150px' },
              { name: 'due', label: 'Échéance', type: 'date', width: '150px' },
              { name: 'summary', label: 'Description', placeholder: 'Facultatif', width: 'minmax(0, 2fr)' },
            ]}
          />
        </AdminForm>
      </section>
    </>
  )
}
