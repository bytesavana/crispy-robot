import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ListTree,
  MapPin,
  Calculator,
  Truck,
  ClipboardList,
  Search,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  { label: '', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Catalog',
    items: [
      { to: '/catalog/categories', label: 'Categories', icon: ListTree },
      { to: '/catalog/zones', label: 'Zones', icon: MapPin, end: true },
      { to: '/catalog/zones/lookup', label: 'Zone lookup', icon: Search },
      { to: '/catalog/estimator', label: 'Estimator', icon: Calculator },
    ],
  },
  { label: 'Providers', items: [{ to: '/providers', label: 'All providers', icon: Truck }] },
  {
    label: 'Orders',
    items: [
      { to: '/orders', label: 'All orders (preview)', icon: ClipboardList },
      { to: '/requests/lookup', label: 'Look up request', icon: Search },
    ],
  },
  { label: 'Consumers', items: [{ to: '/consumers', label: 'All consumers', icon: Users }] },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 py-4">
      <div className="px-2">
        <p className="font-heading text-lg font-semibold text-sidebar-foreground">MtaaPal</p>
        <p className="text-xs text-muted-foreground">Ops console</p>
      </div>
      <nav className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.label || 'root'} className="flex flex-col gap-1">
            {group.label && (
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent',
                    isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
