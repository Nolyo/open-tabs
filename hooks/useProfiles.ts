import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Profile, ProfileGroup, ProfileSummary } from '../types'

interface CaptureMeta {
  groupCount: number
  tabCount: number
}

interface ProfileSnapshot {
  groups: ProfileGroup[]
  meta: CaptureMeta
}

interface SaveProfileInput {
  profileId?: string
  name: string
  description?: string
  groups: ProfileGroup[]
}

interface UseProfilesState {
  profiles: Profile[]
  summaries: ProfileSummary[]
  isLoading: boolean
  isSaving: boolean
  isCapturing: boolean
  isOpening: boolean
  isDeleting: boolean
  error: string | null
  snapshot: ProfileSnapshot | null
}

interface UseProfilesReturn extends UseProfilesState {
  refreshProfiles: () => Promise<void>
  captureCurrentState: () => Promise<ProfileSnapshot | null>
  saveProfile: (payload: SaveProfileInput) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>
  openProfile: (profileId: string, opts?: { openInNewWindow?: boolean }) => Promise<void>
  clearSnapshot: () => void
  clearError: () => void
  setSnapshot: (snapshot: ProfileSnapshot | null) => void
}

const INITIAL_STATE: UseProfilesState = {
  profiles: [],
  summaries: [],
  isLoading: true,
  isSaving: false,
  isCapturing: false,
  isOpening: false,
  isDeleting: false,
  error: null,
  snapshot: null
}

export function useProfiles(): UseProfilesReturn {
  const [state, setState] = useState<UseProfilesState>(INITIAL_STATE)

  const refreshProfiles = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_PROFILES' })
      setState(prev => ({
        ...prev,
        profiles: response?.profiles || [],
        summaries: response?.summaries || [],
        isLoading: false
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Impossible de charger les profils"
      }))
    }
  }, [])

  useEffect(() => {
    refreshProfiles()
  }, [refreshProfiles])

  const captureCurrentState = useCallback(async () => {
    setState(prev => ({ ...prev, isCapturing: true, error: null }))
    try {
      const snapshot = await chrome.runtime.sendMessage({ action: 'CAPTURE_CURRENT_STATE' })
      setState(prev => ({ ...prev, isCapturing: false, snapshot }))
      return snapshot as ProfileSnapshot
    } catch (error) {
      console.error('Erreur lors de la capture des onglets:', error)
      setState(prev => ({
        ...prev,
        isCapturing: false,
        error: "Impossible de capturer les onglets ouverts"
      }))
      return null
    }
  }, [])

  const saveProfile = useCallback(async (payload: SaveProfileInput) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }))
    try {
      await chrome.runtime.sendMessage({ action: 'SAVE_PROFILE', payload })
      await refreshProfiles()
      setState(prev => ({ ...prev, isSaving: false, snapshot: null }))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error)
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: "Impossible d'enregistrer le profil"
      }))
    }
  }, [refreshProfiles])

  const deleteProfile = useCallback(async (profileId: string) => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }))
    try {
      await chrome.runtime.sendMessage({ action: 'DELETE_PROFILE', profileId })
      await refreshProfiles()
      setState(prev => ({ ...prev, isDeleting: false }))
    } catch (error) {
      console.error('Erreur lors de la suppression du profil:', error)
      setState(prev => ({
        ...prev,
        isDeleting: false,
        error: "Impossible de supprimer le profil"
      }))
    }
  }, [refreshProfiles])

  const openProfile = useCallback(async (profileId: string, opts?: { openInNewWindow?: boolean }) => {
    setState(prev => ({ ...prev, isOpening: true, error: null }))
    try {
      await chrome.runtime.sendMessage({ action: 'OPEN_PROFILE', profileId, options: opts })
      setState(prev => ({ ...prev, isOpening: false }))
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du profil:', error)
      setState(prev => ({
        ...prev,
        isOpening: false,
        error: "Impossible d'ouvrir le profil"
      }))
    }
  }, [])

  const clearSnapshot = useCallback(() => {
    setState(prev => ({ ...prev, snapshot: null }))
  }, [])

  const setSnapshot = useCallback((snapshot: ProfileSnapshot | null) => {
    if (!snapshot) {
      clearSnapshot()
      return
    }

    const meta = snapshot.meta ?? {
      groupCount: snapshot.groups.length,
      tabCount: snapshot.groups.reduce((total, group) => total + group.tabs.length, 0)
    }

    setState(prev => ({
      ...prev,
      snapshot: {
        groups: snapshot.groups,
        meta
      }
    }))
  }, [clearSnapshot])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return useMemo(() => ({
    ...state,
    refreshProfiles,
    captureCurrentState,
    saveProfile,
    deleteProfile,
    openProfile,
    clearSnapshot,
    clearError,
    setSnapshot
  }), [state, refreshProfiles, captureCurrentState, saveProfile, deleteProfile, openProfile, clearSnapshot, clearError, setSnapshot])
}
