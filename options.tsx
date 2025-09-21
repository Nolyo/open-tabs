import { useState, useEffect } from "react"
import { useStorage } from "./hooks/useStorage"
import { Storage } from "@plasmohq/storage"
import type { TabGroup, TabUrl } from "./types"

const storage = new Storage()

const GROUP_COLORS = [
  '#grey', '#blue', '#red', '#yellow', '#green',
  '#pink', '#purple', '#cyan', '#orange'
]

function OptionsPage() {
  const {
    groups,
    settings,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    addUrlToGroup,
    removeUrlFromGroup
  } = useStorage()

  const [selectedGroup, setSelectedGroup] = useState<TabGroup | null>(null)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showAddUrl, setShowAddUrl] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupColor, setGroupColor] = useState(GROUP_COLORS[0])
  const [newUrl, setNewUrl] = useState("")
  const [editingGroup, setEditingGroup] = useState<{id: string, name: string, color: string} | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name')
  const [filterBySize, setFilterBySize] = useState<'all' | 'small' | 'medium' | 'large'>('all')
  const [filterByDate, setFilterByDate] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const filteredGroups = groups.filter(group => {
    // Filtre de recherche
    const matchesSearch = searchTerm === '' ||
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.urls.some(url => url.url.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtre par taille
    const matchesSize = filterBySize === 'all' ||
      (filterBySize === 'small' && group.urls.length <= 5) ||
      (filterBySize === 'medium' && group.urls.length > 5 && group.urls.length <= 15) ||
      (filterBySize === 'large' && group.urls.length > 15)

    // Filtre par date
    const now = new Date()
    const groupDate = new Date(group.updatedAt)
    const matchesDate = filterByDate === 'all' ||
      (filterByDate === 'today' && groupDate.toDateString() === now.toDateString()) ||
      (filterByDate === 'week' && now.getTime() - groupDate.getTime() <= 7 * 24 * 60 * 60 * 1000) ||
      (filterByDate === 'month' && now.getTime() - groupDate.getTime() <= 30 * 24 * 60 * 60 * 1000)

    return matchesSearch && matchesSize && matchesDate
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'size':
        return b.urls.length - a.urls.length
      default:
        return 0
    }
  })

  const handleCreateGroup = async () => {
    if (groupName.trim()) {
      await createGroup(groupName.trim(), groupColor)
      setGroupName("")
      setGroupColor(GROUP_COLORS[0])
      setShowAddGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      await deleteGroup(groupId)
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null)
      }
    }
  }

  const handleMoveGroup = async (groupId: string, direction: 'up' | 'down') => {
    const currentIndex = groups.findIndex(g => g.id === groupId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= groups.length) return

    const newGroups = [...groups]
    const temp = newGroups[currentIndex]
    newGroups[currentIndex] = newGroups[newIndex]
    newGroups[newIndex] = temp

    // Mettre à jour le storage
    await storage.set('groups', newGroups)
    // Le hook va rafraîchir automatiquement
  }

  const handleEditGroup = async () => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, {
        name: editingGroup.name,
        color: editingGroup.color
      })
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

  const handleAddUrl = async () => {
    if (selectedGroup && newUrl.trim()) {
      try {
        await addUrlToGroup(selectedGroup.id, newUrl.trim())
        setNewUrl("")
        setShowAddUrl(false)
      } catch (error) {
        alert('Erreur lors de l\'ajout de l\'URL : ' + error.message)
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

            // Créer le groupe
            await createGroup(newGroup.name, newGroup.color)

            // Ajouter les URLs au groupe
            const group = groups.find(g => g.name === newGroup.name)
            if (group) {
              for (const url of newGroup.urls) {
                await addUrlToGroup(group.id, url.url, url.title)
              }
            }
          }
        }
        alert('Import des bookmarks terminé !')
      }
    } catch (error) {
      alert('Erreur lors de l\'import des bookmarks : ' + error.message)
    }
  }

  const handleExportJson = () => {
    const dataStr = JSON.stringify({ groups, settings }, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `open-tabs-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Valider les données
      if (!data.groups || !Array.isArray(data.groups)) {
        throw new Error('Format de fichier invalide')
      }

      // Importer les groupes via le background script
      const response = await chrome.runtime.sendMessage({
        action: 'IMPORT_DATA',
        payload: data
      })

      if (response && response.error) {
        throw new Error(response.error)
      }

      alert('Importation réussie !')
      // La page se rafraîchira automatiquement grâce au hook useStorage
    } catch (error) {
      alert('Erreur lors de l\'importation : ' + error.message)
    } finally {
      // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        color: '#333',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        Open Tabs - Gestion Complète
      </h1>

      {/* Barre d'outils */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="name">Trier par nom</option>
          <option value="date">Trier par date</option>
          <option value="size">Trier par taille</option>
        </select>

        <select
          value={filterBySize}
          onChange={(e) => setFilterBySize(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="all">Toutes tailles</option>
          <option value="small">Petit (&le;5)</option>
          <option value="medium">Moyen (6-15)</option>
          <option value="large">Grand (&gt;15)</option>
        </select>

        <select
          value={filterByDate}
          onChange={(e) => setFilterByDate(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="all">Toutes dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>

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
          + Nouveau groupe
        </button>

        <button
          onClick={handleImportBookmarks}
          style={{
            background: '#34a853',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Importer Bookmarks
        </button>

        <button
          onClick={handleExportJson}
          style={{
            background: '#fbbc04',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Exporter JSON
        </button>

        <input
          type="file"
          accept=".json"
          onChange={handleImportJson}
          style={{ display: 'none' }}
          id="import-json-input"
        />
        <button
          onClick={() => document.getElementById('import-json-input')?.click()}
          style={{
            background: '#ea4335',
            color: 'white',
            border: '2px solid #ea4335',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}
        >
          📁 Importer JSON
        </button>
      </div>

      {/* Compteur de résultats */}
      <div style={{
        marginBottom: '16px',
        fontSize: '14px',
        color: '#666'
      }}>
        {filteredGroups.length} groupe{filteredGroups.length !== 1 ? 's' : ''} affiché{filteredGroups.length !== 1 ? 's' : ''} sur {groups.length}
      </div>

      {/* Grille des groupes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {filteredGroups.map((group, index) => (
          <div
            key={group.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: `4px solid ${group.color}`
            }}
            onClick={() => setSelectedGroup(group)}
          >
            {/* Boutons de réorganisation */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '8px',
              gap: '4px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveGroup(group.id, 'up')
                }}
                disabled={index === 0}
                style={{
                  background: index === 0 ? '#f0f0f0' : '#f8f9fa',
                  color: index === 0 ? '#ccc' : '#333',
                  border: '1px solid #ddd',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '10px'
                }}
              >
                ↑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveGroup(group.id, 'down')
                }}
                disabled={index === filteredGroups.length - 1}
                style={{
                  background: index === filteredGroups.length - 1 ? '#f0f0f0' : '#f8f9fa',
                  color: index === filteredGroups.length - 1 ? '#ccc' : '#333',
                  border: '1px solid #ddd',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: index === filteredGroups.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '10px'
                }}
              >
                ↓
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: group.color,
                  marginRight: '8px'
                }}
              />
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#333',
                flex: 1
              }}>
                {group.name}
              </h3>
              <span style={{
                fontSize: '12px',
                color: '#666',
                backgroundColor: '#f0f0f0',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {group.urls.length}
              </span>
            </div>

            <p style={{
              margin: '8px 0',
              fontSize: '12px',
              color: '#666'
            }}>
              Mis à jour: {new Date(group.updatedAt).toLocaleDateString()}
            </p>

            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  chrome.runtime.sendMessage({
                    action: 'openTabGroup',
                    groupId: group.id
                  })
                }}
                style={{
                  flex: 1,
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Ouvrir
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteGroup(group.id)
                }}
                style={{
                  background: '#ea4335',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <p>Aucun groupe trouvé</p>
        </div>
      )}

      {/* Modal Ajout Groupe */}
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
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              Nouveau groupe
            </h3>

            <input
              type="text"
              placeholder="Nom du groupe"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}
              autoFocus
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Couleur :
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {GROUP_COLORS.map((color) => (
                  <div
                    key={color}
                    onClick={() => setGroupColor(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: groupColor === color ? '3px solid #333' : '2px solid #ddd'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowAddGroup(false)
                  setGroupName("")
                  setGroupColor(GROUP_COLORS[0])
                }}
                style={{
                  flex: 1,
                  background: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateGroup}
                style={{
                  flex: 1,
                  background: '#4285f4',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
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

      {/* Modal Détails Groupe */}
      {selectedGroup && (
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
            padding: '24px',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: selectedGroup.color,
                  marginRight: '12px'
                }}
              />
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                flex: 1
              }}>
                {selectedGroup.name}
              </h3>
              <button
                onClick={() => openEditGroup(selectedGroup)}
                style={{
                  background: '#fbbc04',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '8px'
                }}
              >
                Modifier
              </button>
              <button
                onClick={() => setSelectedGroup(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => setShowAddUrl(true)}
                style={{
                  flex: 1,
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                + Ajouter URL
              </button>
              <button
                onClick={() => {
                  chrome.runtime.sendMessage({
                    action: 'openTabGroup',
                    groupId: selectedGroup.id
                  })
                  setSelectedGroup(null)
                }}
                style={{
                  flex: 1,
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Ouvrir tous les onglets
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                URLs ({selectedGroup.urls.length})
              </h4>

              {selectedGroup.urls.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  Aucune URL dans ce groupe
                </p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedGroup.urls.map((url, index) => (
                    <div
                      key={url.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        borderBottom: '1px solid #f0f0f0',
                        gap: '8px'
                      }}
                    >
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                        minWidth: '20px'
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#333',
                          marginBottom: '2px',
                          wordBreak: 'break-all'
                        }}>
                          {url.title || url.url}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          wordBreak: 'break-all'
                        }}>
                          {url.url}
                        </div>
                      </div>
                      <button
                        onClick={() => removeUrlFromGroup(selectedGroup.id, url.id)}
                        style={{
                          background: '#ea4335',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showAddUrl && (
              <div style={{
                borderTop: '1px solid #e0e0e0',
                paddingTop: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                  Ajouter une URL
                </h4>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setShowAddUrl(false)
                      setNewUrl("")
                    }}
                    style={{
                      flex: 1,
                      background: '#f8f9fa',
                      color: '#333',
                      border: '1px solid #ddd',
                      padding: '10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddUrl}
                    style={{
                      flex: 1,
                      background: '#4285f4',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
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
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}
              autoFocus
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Couleur :
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {GROUP_COLORS.map((color) => (
                  <div
                    key={color}
                    onClick={() => setEditingGroup({...editingGroup, color})}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: editingGroup.color === color ? '3px solid #333' : '2px solid #ddd'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
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
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
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
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OptionsPage