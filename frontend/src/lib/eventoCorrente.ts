const EVENTO_KEY = 'evento_corrente'

export const getEventoCorrente = (): string | null => {
  return localStorage.getItem(EVENTO_KEY)
}

export const setEventoCorrente = (evento: string): void => {
  localStorage.setItem(EVENTO_KEY, evento)
}

export const clearEventoCorrente = (): void => {
  localStorage.removeItem(EVENTO_KEY)
}