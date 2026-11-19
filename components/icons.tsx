// Icônes au trait (24×24), héritent de la couleur du texte.
import type { SVGProps } from 'react'

const PATHS: Record<string, string> = {
  home: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
  activity: 'M4 12h3.5l2.5-6 4 12 2.5-6H20',
  layers: 'M12 4 3.5 8.5 12 13l8.5-4.5zM3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5',
  receipt: 'M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8zM9 8h6M9 11.5h6M9 15h3.5',
  book: 'M5 4.5h9.5A3.5 3.5 0 0 1 18 8v11.5H8A3 3 0 0 1 5 16.5zM5 16.5A3 3 0 0 1 8 13.5h10',
  device: 'M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5zM11 17.5h2',
  sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z',
  refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  logout: 'M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4M10 16l-4-4 4-4M6 12h9',
  arrow: 'M7 17 17 7M9 7h8v8',
  grid: 'M5 5h5.5v5.5H5zM13.5 5H19v5.5h-5.5zM5 13.5h5.5V19H5zM13.5 13.5H19V19h-5.5z',
  mail: 'M4 6h16v12H4zM4.5 6.5 12 12.5l7.5-6',
  pin: 'M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21zM12 8a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  calendar: 'M5 6h14v13.5H5zM5 10h14M9 3.5v4M15 3.5v4',
  folder: 'M4 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2h7A1.5 1.5 0 0 1 20 9v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z',
}

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
