// app/admin/dashboard/metadata.ts
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - RedPulse',
  description: 'RedPulse Admin Dashboard - Manage donors, hospitals, and blood inventory',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
}