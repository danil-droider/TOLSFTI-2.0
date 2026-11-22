import { useState, useCallback } from "react"
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
  X,
  Image,
  Smile,
  LayoutGrid,
} from "lucide-react"
import { compressImageToDataUrl } from "../utils/image.ts"
import type { BadgeValue } from "./GoalBadge.tsx"

const MODES: { id: 'icon' | 'emoji' | 'photo'; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'icon', label: 'Preset Icon', Icon: LayoutGrid },
  { id: 'emoji', label: 'Emoji', Icon: Smile },
  { id: 'photo', label: 'Photo', Icon: Image },
]

// Backwards-compatible preset icon keys (matches GoalBadge preset rendering).
const PRESET_ICONS: string[] = [
  'Laptop', 'Camera', 'Target', 'Briefcase', 'House', 'Watch',
  'Smartphone', 'Gift', 'Plane', 'Star', 'Heart',
]

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

// Curated goal emojis, effortless to tap on mobile.
const CURATED_EMOJIS: string[] = ['🎯', '✈️', '💻', '🚗', '🏠', '📱', '⌚', '🏖️']

type GoalBadgePickerProps = {
  badge: BadgeValue | null | undefined
  onChange: (badge: BadgeValue) => void
}

export default function GoalBadgePicker({ badge, onChange }: GoalBadgePickerProps) {
  const [mode, setMode] = useState<'icon' | 'emoji' | 'photo'>(badge?.kind ?? 'icon')
  const [iconValue, setIconValue] = useState(badge?.kind === 'icon' ? badge.value : 'Laptop')
  const [emojiValue, setEmojiValue] = useState(badge?.kind === 'emoji' ? badge.value : '🎯')
  const [photoValue, setPhotoValue] = useState<string | null>(badge?.kind === 'photo' ? badge.value : null)

  const handleChange = useCallback(
    (next: BadgeValue) => {
      onChange(next)
    },
    [onChange],
  )

  const handleSelectIcon = (value: string) => {
    setIconValue(value)
    setMode('icon')
    handleChange({ kind: 'icon', value })
  }

  const handleSelectEmoji = (value: string) => {
    setEmojiValue(value)
    setMode('emoji')
    handleChange({ kind: 'emoji', value })
  }

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImageToDataUrl(file)
    if (dataUrl) {
      setPhotoValue(dataUrl)
      setMode('photo')
      handleChange({ kind: 'photo', value: dataUrl })
    }
    // Reset the input so the same file can be re-selected.
    event.target.value = ''
  }

  const handleRemovePhoto = () => {
    setPhotoValue(null)
    setMode('icon')
    handleChange({ kind: 'icon', value: 'Laptop' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border border-white/6 rounded-xl bg-surface-1 p-1">
        {MODES.map((m) => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(m.id)}
              className={`flex-1 rounded-lg py-2 px-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                active
                  ? 'bg-emerald text-emerald-text'
                  : 'text-muted hover:bg-white/5'
              }`}
            >
              <m.Icon className="w-4 h-4" />
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>

      {mode === 'icon' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Preset Icon</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_ICONS.map((name) => {
              const active = iconValue === name
              const IconComp = ICON_MAP[name]
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectIcon(name)}
                  className={`size-10 rounded-lg border flex items-center justify-center transition-colors ${
                    active
                      ? 'border-emerald bg-emerald/20'
                      : 'border-white/6 bg-surface-1 hover:bg-white/5'
                  }`}
                >
                  {IconComp ? (
                    <IconComp className={`w-5 h-5 ${active ? 'text-emerald-text' : 'text-muted'}`} />
                  ) : (
                    <span className="text-sm">{name}</span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {mode === 'emoji' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Emoji</span>
          </div>
          <div className="relative">
            <input
              type="text"
              maxLength={2}
              value={emojiValue}
              onChange={(e) => {
                const v = e.target.value.slice(-2)
                setEmojiValue(v)
                handleChange({ kind: 'emoji', value: v })
              }}
              placeholder="🎯"
              className="bg-surface-1 rounded-xl pl-4 pr-4 min-h-[44px] py-2 text-text tabular-nums w-full font-sans outline-none focus:ring-2 focus:ring-emerald/50 text-2xl"
            />
          </div>
          <div className="grid grid-cols-8 gap-2">
            {CURATED_EMOJIS.map((emoji) => {
              const active = emojiValue === emoji
              return (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectEmoji(emoji)}
                  className={`size-10 rounded-lg border flex items-center justify-center text-xl transition-colors ${
                    active
                      ? 'border-emerald bg-emerald/20'
                      : 'border-white/6 bg-surface-1 hover:bg-white/5'
                  }`}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {mode === 'photo' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Photo</span>
          </div>
          {photoValue ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={photoValue}
                alt=""
                className="w-24 h-24 rounded-xl object-cover border border-white/6"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="size-10 rounded-full border border-white/6 bg-surface-1 flex items-center justify-center text-muted hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null}
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoSelect}
            />
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/6 border-dashed bg-surface-1 p-3 text-xs text-muted hover:bg-white/5 transition-colors"
            >
              <Image className="w-4 h-4" />
              <span>Choose Photo</span>
            </button>
          </label>
          <p className="text-[10px] text-muted">
            Auto-compressed to 160×160 JPEG to keep localStorage light.
          </p>
        </section>
      )}
    </div>
  )
}
