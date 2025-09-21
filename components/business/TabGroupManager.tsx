import React, { useState, useEffect } from 'react'
import { useTabManagement } from '~/hooks'
import { GroupItem } from '~/components/ui/GroupItem'
import { TabList } from '~/components/ui/TabList'
import { Button } from '~/components/ui/Button'
import { Modal } from '~/components/ui/Modal'
import { Input } from '~/components/ui/Input'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { notificationService } from '~/hooks/services'
import { GROUP_COLORS } from '~/constants'

export function TabGroupManager() {
  const {
    tabs,
    groups,
    activeGroup,
    setActiveGroup,
    refreshTabs,
    refreshGroups,
    addTabToGroup,
    removeTabFromGroup,
    closeTab,
    createGroup,
    deleteGroup,
  } = useTabManagement()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState<keyof typeof GROUP_COLORS>('blue')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    refreshGroups()
  }, [refreshGroups])

  useEffect(() => {
    refreshTabs()
  }, [activeGroup, refreshTabs])

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    setIsLoading(true)
    try {
      await createGroup(newGroupName, newGroupColor)
      setIsCreateModalOpen(false)
      setNewGroupName('')
      setNewGroupColor('blue')
      notificationService.success('Groupe créé', `Le groupe "${newGroupName}" a été créé avec succès`)
    } catch (error) {
      notificationService.error('Erreur', 'Impossible de créer le groupe')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return

    try {
      await deleteGroup(groupId)
      notificationService.success('Groupe supprimé', 'Le groupe a été supprimé avec succès')
    } catch (error) {
      notificationService.error('Erreur', 'Impossible de supprimer le groupe')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Groupes d&apos;onglets</h2>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        >
          Nouveau groupe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Groupes</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => setActiveGroup(null)}
              className={`w-full text-left p-3 rounded-md transition-colors ${
                activeGroup === null
                  ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Tous les onglets</span>
                <span className="text-sm text-gray-500">{tabs.length}</span>
              </div>
            </button>

            {groups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isActive={activeGroup === group.id}
                onClick={() => setActiveGroup(group.id)}
                onDelete={() => handleDeleteGroup(group.id)}
                showActions={true}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              {activeGroup ? 'Onglets du groupe' : 'Tous les onglets'}
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <TabList
                tabs={tabs}
                onTabClose={closeTab}
                onTabContextMenu={(e, tabId) => {
                  e.preventDefault()
                  console.log('Context menu for tab:', tabId)
                }}
                showGroupHeaders={false}
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un nouveau groupe"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nom du groupe"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Entrez un nom pour le groupe"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur du groupe
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(GROUP_COLORS).map(([colorKey, colorValue]) => (
                <button
                  key={colorKey}
                  onClick={() => setNewGroupColor(colorKey as keyof typeof GROUP_COLORS)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    newGroupColor === colorKey
                      ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: colorValue }}
                  title={colorKey}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isLoading}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}