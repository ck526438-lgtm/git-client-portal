import type { Milestone } from '@/lib/types'
import { frDate, milestoneLabel, milestoneTone } from '@/lib/format'
import { Bar, Empty, Pill } from './ui'

export default function MilestoneRail({ items }: { items: Milestone[] }) {
  if (items.length === 0) return <Empty>Aucune étape n'est planifiée pour le moment.</Empty>

  return (
    <div className="rail">
      {items.map((item) => {
        const tone = milestoneTone[item.status]
        return (
          <article className="stop" key={item.id} data-tone={tone}>
            <div className="stop-head">
              <h3>{item.title}</h3>
              <Pill tone={tone}>{milestoneLabel[item.status]}</Pill>
              <span className="stop-when">{item.due ? `attendu le ${frDate(item.due)}` : 'sans échéance'}</span>
            </div>
            {item.summary ? <p className="stop-summary">{item.summary}</p> : null}
            {item.status !== 'planned' || item.progress > 0 ? (
              <div className="stop-progress">
                <Bar value={item.progress} tone={tone} />
                <span>{item.progress} %</span>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
