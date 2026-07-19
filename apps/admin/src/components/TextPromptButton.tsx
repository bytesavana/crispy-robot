import { useState } from 'react'
import { Button, type buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  label: string
  title: string
  fieldLabel: string
  placeholder?: string
  onSubmit: (value: string) => Promise<void>
  variant?: VariantProps<typeof buttonVariants>['variant']
  icon?: React.ReactNode
}

/** Small dialog collecting one text value before calling a mutation, e.g. an assigned runner ref or a cancel reason. */
export function TextPromptButton({ label, title, fieldLabel, placeholder, onSubmit, variant = 'outline', icon }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await onSubmit(value)
      setOpen(false)
      setValue('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} size="sm">
          {icon}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prompt-value">{fieldLabel}</Label>
          <Input id="prompt-value" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoFocus />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Working…' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
