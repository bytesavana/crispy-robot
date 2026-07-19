import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ContactChannelDto } from '@/types/dto'

interface Props {
  channels: ContactChannelDto[]
  onChange: (channels: ContactChannelDto[]) => void
}

export function ContactChannelsEditor({ channels, onChange }: Props) {
  function update(index: number, patch: Partial<ContactChannelDto>) {
    onChange(channels.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function remove(index: number) {
    onChange(channels.filter((_, i) => i !== index))
  }

  function add() {
    onChange([...channels, { type: 'phone', value: '', isPrimary: channels.length === 0 }])
  }

  return (
    <div className="flex flex-col gap-2">
      {channels.map((channel, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            className="w-28"
            placeholder="type"
            value={channel.type}
            onChange={(e) => update(index, { type: e.target.value })}
          />
          <Input
            className="flex-1"
            placeholder="value"
            value={channel.value}
            onChange={(e) => update(index, { value: e.target.value })}
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={channel.isPrimary}
              onChange={(e) => update(index, { isPrimary: e.target.checked })}
            />
            Primary
          </label>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus className="size-4" /> Add contact channel
      </Button>
    </div>
  )
}
