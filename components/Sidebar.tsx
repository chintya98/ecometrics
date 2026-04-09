'use client'

import { usePathname } from 'next/navigation'

const menuItems = [
  {
    label: 'Overview',
    href: '/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'Input Data',
    href: '/input',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="5" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 13h4M13 11v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-eco-surface border-r border-eco-border flex flex-col">
      {/* Logo */}
      <div className="px-6 pt-6 pb-8">
        <h1 className="text-xl font-bold text-eco-green-700">EcoMetrics</h1>
        <p className="text-xs text-eco-green-600 mt-0.5">Living Canvas</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1
                transition-all duration-150
                ${
                  isActive
                    ? 'text-eco-green-700 bg-eco-green-50 border-l-[3px] border-eco-green-600 pl-[9px]'
                    : 'text-eco-muted hover:text-eco-text hover:bg-gray-50'
                }
              `}
            >
              <span className={isActive ? 'text-eco-green-600' : ''}>{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-eco-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-eco-green-100 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="6" r="3" stroke="#166534" strokeWidth="1.5" />
              <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-eco-text">Alex River</p>
            <p className="text-xs text-eco-muted">Sustainability Lead</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
