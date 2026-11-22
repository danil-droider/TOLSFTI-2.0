import {
  Briefcase,
  Camera,
  Gift,
  Heart,
  House,
  Laptop,
  Plane,
  Smartphone,
  Star,
  Target,
  Watch,
} from "lucide-react"

export type BadgeValue = { kind: 'icon' | 'emoji' | 'photo'; value: string }

type GoalBadgeProps = {
  badge: BadgeValue | null | undefined
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop,
  Camera,
  Target,
  Briefcase,
  House,
  Watch,
  Smartphone,
  Gift,
  Plane,
  Star,
  Heart,
}

export default function GoalBadge({ badge }: GoalBadgeProps) {
  const kind = badge?.kind ?? 'icon'
  const value = badge?.value ?? 'Laptop'

  if (kind === 'photo') {
    return (
      <div className="size-11 rounded-xl overflow-hidden border border-white/6">
        <img src={value} alt="" className="object-cover w-full h-full" />
      </div>
    )
  }

  if (kind === 'emoji') {
    return (
      <div className="size-11 rounded-full bg-white/10 border border-white/6 flex items-center justify-center text-xl">
        {value}
      </div>
    )
  }

  // Preset icon: unchanged rendering, now in the same size-11 slot footprint.
  const IconComponent = ICON_MAP[value] ?? Laptop
  return (
    <div className="size-11 bg-surface-1 rounded border border-white/6 flex items-center justify-center">
      <IconComponent className="w-5 h-5 text-muted" />
    </div>
  )
}
