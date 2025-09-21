import { useState, useEffect } from "react"
import { useStorage } from "./hooks/useStorage"
import { useTheme } from "./hooks/useTheme"
import { Storage } from "@plasmohq/storage"
import type { TabGroup } from "./types"
import "./style.css"

const storage = new Storage()
const GROUP_COLORS = [
  '#808080', '#4285f4', '#ea4335', '#fbbc04', '#34a853',
  '#ff6b9d', '#9c27b0', '#00bcd4', '#ff9800'
]

function IndexPopup() {
  const { groups, loading, createGroup, addUrlToGroup, removeUrlFromGroup } = useStorage()
  const { theme, toggleTheme } = useTheme()
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [showGroupSelect, setShowGroupSelect] = useState(false)
  const [showOpenTabs, setShowOpenTabs] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<{id: string, name: string, color: string} | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [contextMenuData, setContextMenuData] = useState<{url: string, title: string} | null>(null)
  const [openTabs, setOpenTabs] = useState<Array<{id: number, url: string, title: string, favicon?: string}>>([])
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set())
  const [loadingTabs, setLoadingTabs] = useState(false)
const [sortBy, setSortBy] = useState<'name' | 'date' | 'url'>('date')

  // Vérifier s'il y a des données du menu contextuel au chargement
  useEffect(() => {
    const checkContextMenuData = async () => {
      const data = await storage.get('contextMenuData')
      if (data) {
        setContextMenuData(data)
        setShowGroupSelect(true)
        // Nettoyer les données après utilisation
        await storage.remove('contextMenuData')
      }
    }
    checkContextMenuData()
  }, [])

  // Charger les onglets ouverts quand la section est affichée
  useEffect(() => {
    if (showOpenTabs) {
      loadOpenTabs()
    } else {
      setOpenTabs([])
      setSelectedTabs(new Set())
    }
  }, [showOpenTabs])

  const loadOpenTabs = async () => {
    setLoadingTabs(true)
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true })
      const validTabs = tabs
        .filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
        .map(tab => ({
          id: tab.id,
          url: tab.url!,
          title: tab.title || 'Sans titre',
          favicon: tab.favIconUrl
        }))
      setOpenTabs(validTabs)
    } catch (error) {
      console.error('Error loading open tabs:', error)
    } finally {
      setLoadingTabs(false)
    }
  }

  const toggleTabSelection = (tabId: number) => {
    setSelectedTabs(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(tabId)) {
        newSelection.delete(tabId)
      } else {
        newSelection.add(tabId)
      }
      return newSelection
    })
  }

  const selectAllTabs = () => {
    const allTabIds = new Set(openTabs.map(tab => tab.id))
    setSelectedTabs(allTabIds)
  }

  const clearSelection = () => {
    setSelectedTabs(new Set())
  }

  const sortUrls = (urls: typeof group.urls) => {
    const sortedUrls = [...urls]

    switch (sortBy) {
      case 'name':
        return sortedUrls.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      case 'url':
        return sortedUrls.sort((a, b) => a.url.localeCompare(b.url))
      case 'date':
      default:
        return sortedUrls.sort((a, b) => a.order - b.order)
    }
  }

  const addSelectedTabsToGroup = async (groupId: string) => {
    if (selectedTabs.size === 0) return

    try {
      const selectedTabsArray = openTabs.filter(tab => selectedTabs.has(tab.id))
      let addedCount = 0
      let duplicateCount = 0

      for (const tab of selectedTabsArray) {
        try {
          await addUrlToGroup(groupId, tab.url, tab.title)
          addedCount++
        } catch (error) {
          if (error.message === 'Cette URL existe déjà dans ce groupe') {
            duplicateCount++
          }
        }
      }

      let message = `${addedCount} onglet(s) ajouté(s) avec succès`
      if (duplicateCount > 0) {
        message += ` (${duplicateCount} déjà présent(s))`
      }

      alert(message)
      setShowOpenTabs(false)
      setSelectedTabs(new Set())
    } catch (error) {
      console.error('Error adding selected tabs:', error)
      alert('Erreur lors de l&apos;ajout des onglets')
    }
  }

  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      await createGroup(newGroupName.trim())
      setNewGroupName("")
      setShowAddGroup(false)
    }
  }

  const handleAddCurrentTab = async (groupId: string) => {
    try {
      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      if (currentTab && currentTab.url) {
        await addUrlToGroup(groupId, currentTab.url, currentTab.title)
        setSelectedGroup(null)
      }
    } catch (error) {
      console.error('Error adding current tab:', error)
      // Afficher un message d'erreur si c'est un doublon
      if (error.message === 'Cette URL existe déjà dans ce groupe') {
        alert('Cette page est déjà dans ce groupe !')
      }
    }
  }

  const handleEditGroup = async () => {
    if (editingGroup) {
      const updatedGroups = groups.map(group =>
        group.id === editingGroup.id
          ? {
              ...group,
              name: editingGroup.name,
              color: editingGroup.color,
              updatedAt: new Date()
            }
          : group
      )
      await storage.set('groups', updatedGroups)
      setEditingGroup(null)
      setShowEditGroup(false)
    }
  }

  const openEditGroup = (group: TabGroup) => {
    setEditingGroup({
      id: group.id,
      name: group.name,
      color: group.color
    })
    setShowEditGroup(true)
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      const updatedGroups = groups.filter(group => group.id !== groupId)
      await storage.set('groups', updatedGroups)
      if (selectedGroup === groupId) {
        setSelectedGroup(null)
      }
    }
  }

  const handleDeleteUrl = async (groupId: string, urlId: string) => {
    try {
      await removeUrlFromGroup(groupId, urlId)
    } catch (error) {
      console.error('Error deleting URL:', error)
      alert('Erreur lors de la suppression de l&apos;URL')
    }
  }

  const handleAddFromContextMenu = async (groupId: string) => {
    if (!contextMenuData) return

    try {
      await addUrlToGroup(groupId, contextMenuData.url, contextMenuData.title)
      setShowGroupSelect(false)
      setContextMenuData(null)
      alert('URL ajoutée avec succès !')
    } catch (error) {
      console.error('Error adding URL from context menu:', error)
      if (error.message === 'Cette URL existe déjà dans ce groupe') {
        alert('Cette URL est déjà dans ce groupe !')
      } else {
        alert('Erreur lors de l\'ajout de l\'URL')
      }
    }
  }

  const handleImportBookmarks = async () => {
    try {
      const bookmarks = await chrome.bookmarks.getTree()
      const bookmarkBar = bookmarks[0].children?.find(child => child.title === 'Bookmarks Bar')

      if (bookmarkBar && bookmarkBar.children) {
        for (const folder of bookmarkBar.children) {
          if (folder.children && folder.children.length > 0) {
            const newGroup: TabGroup = {
              id: Date.now().toString() + Math.random(),
              name: folder.title,
              color: GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
              urls: folder.children
                .filter(bookmark => bookmark.url && !bookmark.url.startsWith('javascript:'))
                .map((bookmark, index) => ({
                  id: Date.now().toString() + index,
                  url: bookmark.url!,
                  title: bookmark.title,
                  groupId: '',
                  order: index
                })),
              createdAt: new Date(),
              updatedAt: new Date()
            }

            await createGroup(newGroup.name, newGroup.color)

            const group = groups.find(g => g.name === newGroup.name)
            if (group) {
              for (const url of newGroup.urls) {
                await addUrlToGroup(group.id, url.url, url.title)
              }
            }
          }
        }
        alert('Import des bookmarks terminé !')
        setShowImportExport(false)
      }
    } catch (error) {
      alert('Erreur lors de l\'import des bookmarks : ' + error.message)
    }
  }

  const handleExportJson = () => {
    const dataStr = JSON.stringify({ groups }, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `open-tabs-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.urls.some(url => url.url.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenGroup = async (groupId: string) => {
    try {
      await chrome.runtime.sendMessage({
        action: 'openTabGroup',
        groupId
      })
      window.close()
    } catch (error) {
      console.error('Error opening group:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        width: '350px',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{
      width: '350px',
      maxHeight: '500px',
      padding: '16px',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        }}>
          Open Tabs
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              padding: '6px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: showAdvanced ? 'var(--accent-red)' : 'var(--bg-secondary)',
              color: showAdvanced ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            {showAdvanced ? 'Mode simple' : 'Mode avancé'}
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Aucun groupe créé
          </p>
          <button
            onClick={() => setShowAddGroup(true)}
            style={{
              background: '#4285f4',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Créer un groupe
          </button>
        </div>
      ) : (
        <>
          {/* Mode avancé */}
        {showAdvanced && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '8px',
                fontSize: '12px'
              }}
            />

            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowImportExport(true)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  background: '#fbbc04',
                  color: 'white',
                  border: 'none',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Import/Export
              </button>
              <button
                onClick={() => setShowOpenTabs(true)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Onglets ouverts
              </button>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setShowAddGroup(true)}
            style={{
              flex: 1,
              background: '#4285f4',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + Nouveau groupe
          </button>
          {selectedGroup && (
            <button
              onClick={() => handleAddCurrentTab(selectedGroup)}
              style={{
                flex: 1,
                background: '#34a853',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Ajouter l&apos;onglet
            </button>
          )}
        </div>

          <div style={{
            maxHeight: '350px',
            overflowY: 'auto'
          }}>
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: selectedGroup === group.id ? 'var(--bg-secondary)' : 'var(--bg-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: group.color,
                      marginRight: '8px'
                    }}
                  />
                  <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    flex: 1
                  }}>
                    {group.name}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {group.urls.length}
                  </span>
                </div>

                {/* Afficher les URLs du groupe */}
                {selectedGroup === group.id && group.urls.length > 0 && (
                  <>
                    {/* Options de tri */}
                    <div style={{
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>Trier par :</span>
                      <button
                        onClick={() => setSortBy('date')}
                        style={{
                          background: sortBy === 'date' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                          color: sortBy === 'date' ? 'white' : 'var(--text-primary)',
                          border: '1px solid var(--border-primary)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '9px'
                        }}
                      >
                        Date
                      </button>
                      <button
                        onClick={() => setSortBy('name')}
                        style={{
                          background: sortBy === 'name' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                          color: sortBy === 'name' ? 'white' : 'var(--text-primary)',
                          border: '1px solid var(--border-primary)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '9px'
                        }}
                      >
                        Nom
                      </button>
                      <button
                        onClick={() => setSortBy('url')}
                        style={{
                          background: sortBy === 'url' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                          color: sortBy === 'url' ? 'white' : 'var(--text-primary)',
                          border: '1px solid var(--border-primary)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '9px'
                        }}
                      >
                        URL
                      </button>
                    </div>
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)'
                    }}>
                    {sortUrls(group.urls).slice(0, 5).map((url, index) => (
                      <div
                        key={url.id}
                        style={{
                          marginBottom: '3px',
                          padding: '4px',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: '3px',
                          border: '1px solid var(--border-secondary)',
                          cursor: 'default'
                        }}
                        title={url.url} // Tooltip au survol
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, marginRight: '8px' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1px' }}>
                              {url.title || 'Sans titre'}
                            </div>
                            <div style={{
                              color: 'var(--text-secondary)',
                              fontSize: '10px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {url.url}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteUrl(group.id, url.id)}
                            style={{
                              background: 'var(--accent-red)',
                              color: 'white',
                              border: 'none',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              minWidth: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Supprimer cette URL"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {group.urls.length > 5 && (
                      <div style={{
                        fontStyle: 'italic',
                        marginTop: '4px',
                        padding: '4px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '3px',
                        textAlign: 'center'
                      }}>
                        +{group.urls.length - 5} autres URLs...
                      </div>
                    )}
                  </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                    style={{
                      flex: 1,
                      background: selectedGroup === group.id ? '#ea4335' : '#f8f9fa',
                      color: selectedGroup === group.id ? 'white' : '#333',
                      border: '1px solid #e0e0e0',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {selectedGroup === group.id ? 'Masquer' : 'Voir URLs'}
                  </button>
                  <button
                    onClick={() => handleOpenGroup(group.id)}
                    style={{
                      flex: 1,
                      background: '#1a73e8',
                      color: 'white',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Ouvrir
                  </button>
                  {showAdvanced && (
                    <button
                      onClick={() => openEditGroup(group)}
                      style={{
                        background: '#fbbc04',
                        color: 'white',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      ✏️
                    </button>
                  )}
                  {showAdvanced && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      style={{
                        background: '#ea4335',
                        color: 'white',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bouton pour ouvrir TOUS les groupes */}
          {groups.length > 0 && (
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <button
                onClick={async () => {
                  for (const group of groups) {
                    try {
                      await chrome.runtime.sendMessage({
                        action: 'openTabGroup',
                        groupId: group.id
                      })
                    } catch (error) {
                      console.error('Error opening group:', error)
                    }
                  }
                  window.close()
                }}
                style={{
                  width: '100%',
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                🌅 Ouvrir TOUS les groupes ({groups.length})
              </button>
            </div>
          )}
        </>
      )}

      {showAddGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '280px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Nouveau groupe
            </h3>
            <input
              type="text"
              placeholder="Nom du groupe"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowAddGroup(false)
                  setNewGroupName("")
                }}
                style={{
                  flex: 1,
                  background: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleAddGroup}
                style={{
                  flex: 1,
                  background: '#4285f4',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        {filteredGroups.length} groupe{filteredGroups.length !== 1 ? 's' : ''} affiché{filteredGroups.length !== 1 ? 's' : ''} sur {groups.length}
      </div>

      {/* Modal Édition Groupe */}
      {showEditGroup && editingGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '300px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Modifier le groupe
            </h3>

            <input
              type="text"
              placeholder="Nom du groupe"
              value={editingGroup.name}
              onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '14px'
              }}
              autoFocus
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                Couleur :
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {GROUP_COLORS.map((color) => (
                  <div
                    key={color}
                    onClick={() => setEditingGroup({...editingGroup, color})}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: editingGroup.color === color ? '3px solid #333' : '2px solid #ddd'
                      }}
                    />
                    <span style={{ fontSize: '8px', color: '#666' }}>
                      {color.replace('#', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowEditGroup(false)
                  setEditingGroup(null)
                }}
                style={{
                  flex: 1,
                  background: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleEditGroup}
                style={{
                  flex: 1,
                  background: '#4285f4',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import/Export */}
      {showImportExport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '300px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Import / Export
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleImportBookmarks}
                style={{
                  width: '100%',
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📥 Importer Bookmarks
              </button>

              <button
                onClick={handleExportJson}
                style={{
                  width: '100%',
                  background: '#fbbc04',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📤 Exporter JSON
              </button>
            </div>

            <button
              onClick={() => setShowImportExport(false)}
              style={{
                width: '100%',
                background: '#f8f9fa',
                color: '#333',
                border: '1px solid #ddd',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '12px'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Onglets Ouverts */}
      {showOpenTabs && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxHeight: '80vh',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Onglets ouverts
              </h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={selectAllTabs}
                  style={{
                    background: '#4285f4',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    background: '#ea4335',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            {loadingTabs ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                Chargement des onglets...
              </div>
            ) : openTabs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                Aucun onglet disponible
              </div>
            ) : (
              <>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}>
                  {openTabs.map((tab) => {
                    const isInAnyGroup = groups.some(group =>
                      group.urls.some(url => url.url === tab.url)
                    )

                    return (
                      <div
                        key={tab.id}
                        onClick={() => toggleTabSelection(tab.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          backgroundColor: selectedTabs.has(tab.id) ? '#e8f0fe' : 'white',
                          '&:hover': {
                            backgroundColor: selectedTabs.has(tab.id) ? '#d2e3fc' : '#f8f9fa'
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTabs.has(tab.id)}
                          onChange={() => {}}
                          style={{
                            marginRight: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {tab.favicon && (
                          <img
                            src={tab.favicon}
                            alt=""
                            style={{
                              width: '16px',
                              height: '16px',
                              marginRight: '8px',
                              borderRadius: '2px'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div style={{ flex: 1, marginRight: '8px' }}>
                          <div style={{
                            fontWeight: '500',
                            color: '#333',
                            fontSize: '11px',
                            marginBottom: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {tab.title}
                          </div>
                          <div style={{
                            color: '#666',
                            fontSize: '9px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {tab.url}
                          </div>
                        </div>
                        {isInAnyGroup && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#34a853',
                              flexShrink: 0,
                              title: 'Déjà dans un groupe'
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
                  {selectedTabs.size} onglet(s) sélectionné(s) •
                  <span style={{ color: '#34a853' }}>
                    {' '}● = déjà dans un groupe
                  </span>
                </div>

                {selectedTabs.size > 0 && groups.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                      Ajouter à :
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => addSelectedTabsToGroup(group.id)}
                          style={{
                            background: 'white',
                            color: '#333',
                            border: '1px solid #ddd',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: group.color
                            }}
                          />
                          {group.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowOpenTabs(false)
                  setSelectedTabs(new Set())
                }}
                style={{
                  flex: 1,
                  background: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Fermer
              </button>
              {groups.length === 0 && (
                <button
                  onClick={() => {
                    setShowOpenTabs(false)
                    setShowAddGroup(true)
                  }}
                  style={{
                    flex: 1,
                    background: '#4285f4',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Créer un groupe
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Sélection de Groupe (Menu Contextuel) */}
      {showGroupSelect && contextMenuData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '320px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Ajouter à un groupe
            </h3>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px', fontSize: '12px' }}>
                {contextMenuData.title || 'Sans titre'}
              </div>
              <div style={{ color: '#666', fontSize: '10px', wordBreak: 'break-all' }}>
                {contextMenuData.url}
              </div>
            </div>

            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
                Aucun groupe disponible. Créez d&apos;abord un groupe.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleAddFromContextMenu(group.id)}
                    style={{
                      width: '100%',
                      background: 'white',
                      color: '#333',
                      border: '1px solid #ddd',
                      padding: '12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left'
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: group.color,
                        flexShrink: 0
                      }}
                    />
                    <span style={{ flex: 1 }}>{group.name}</span>
                    <span style={{ color: '#666', fontSize: '10px' }}>
                      {group.urls.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowGroupSelect(false)
                  setContextMenuData(null)
                }}
                style={{
                  flex: 1,
                  background: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Annuler
              </button>
              {groups.length === 0 && (
                <button
                  onClick={() => {
                    setShowGroupSelect(false)
                    setContextMenuData(null)
                    setShowAddGroup(true)
                  }}
                  style={{
                    flex: 1,
                    background: '#4285f4',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Créer un groupe
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
