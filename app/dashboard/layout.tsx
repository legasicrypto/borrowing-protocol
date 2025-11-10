import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
