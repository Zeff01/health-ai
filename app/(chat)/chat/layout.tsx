import { SidebarDesktop } from '@/components/sidebar-desktop'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="relative h-[calc(100vh_-_theme(spacing.16))] overflow-hidden flex">
      {children}
    </div>
  )
}
