import { useState } from 'react'

export interface UseModalReturn {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export function useModal(initialState: boolean = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return {
    isOpen,
    openModal,
    closeModal,
  }
}