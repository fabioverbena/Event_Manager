import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '€ 0,00'
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr, { locale: it })
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

export function formatDateLong(date: string | Date): string {
  return formatDate(date, 'dd MMMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  
  return new Intl.NumberFormat('it-IT').format(value)
}

export function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function getStatoBadgeColor(stato: 'bozza' | 'confermato' | 'evaso' | 'annullato'): string {
  const colors = {
    bozza: 'bg-yellow-100 text-yellow-800',
    confermato: 'bg-blue-100 text-blue-800',
    evaso: 'bg-green-100 text-green-800',
    annullato: 'bg-red-100 text-red-800',
  }
  return colors[stato] || 'bg-gray-100 text-gray-800'
}

export function getInitials(ragioneSociale: string): string {
  return ragioneSociale
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')
}

export function validatePartitaIVA(piva: string): boolean {
  const cleaned = piva.replace(/\s/g, '')
  return /^[0-9]{11}$/.test(cleaned)
}

export function validateCodiceFiscale(cf: string): boolean {
  const cleaned = cf.replace(/\s/g, '').toUpperCase()
  return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(cleaned)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}