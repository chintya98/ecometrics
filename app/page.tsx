import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import SiteSearch from '@/components/SiteSearch'
import FilterBar from '@/components/FilterBar'
import DashboardContent from '@/components/DashboardContent'

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-eco-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-eco-border/50">
          <h2 className="text-xl font-semibold text-eco-text">Dashboard</h2>
          <Suspense fallback={<div className="w-64 h-9 bg-eco-bg rounded-lg animate-pulse" />}>
            <SiteSearch className="w-64" />
          </Suspense>
        </header>

        {/* Filter bar */}
        <Suspense fallback={<div className="h-16 mx-8 mt-4 bg-eco-bg rounded-lg animate-pulse" />}>
          <FilterBar />
        </Suspense>

        {/* Dashboard content */}
        <Suspense
          fallback={
            <div className="space-y-6 px-8 pt-2">
              <div className="grid grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 bg-eco-surface rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-5">
                <div className="col-span-3 h-80 bg-eco-surface rounded-2xl animate-pulse" />
                <div className="col-span-2 h-80 bg-eco-surface rounded-2xl animate-pulse" />
              </div>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  )
}
