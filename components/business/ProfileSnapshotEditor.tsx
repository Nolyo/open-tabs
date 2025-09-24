import React from "react"

import { Button } from "~/components/ui/Button"
import type { ProfileGroup } from "~/types"

interface ProfileSnapshotEditorProps {
  groups: ProfileGroup[]
  onRemoveGroup: (groupId: string) => void
  onRemoveTab: (groupId: string, tabId: string) => void
  onMoveGroup: (groupId: string, direction: "up" | "down") => void
  onMoveTab: (groupId: string, tabId: string, direction: "up" | "down") => void
}

export function ProfileSnapshotEditor({
  groups,
  onRemoveGroup,
  onRemoveTab,
  onMoveGroup,
  onMoveTab
}: ProfileSnapshotEditorProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Aucun groupe capturé. Capturez une session ou ajoutez des onglets avant
        d'enregistrer un profil.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        const isUngrouped = group.id === "ungrouped"
        const groupLabel = isUngrouped
          ? "Onglets non groupés"
          : group.title || "Groupe sans titre"

        return (
          <div
            key={group.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!isUngrouped && (
                    <span
                      className="inline-block h-3 w-3 rounded-full border"
                      style={{ backgroundColor: group.color || "#4A90E2" }}
                    />
                  )}
                  <p className="text-sm font-semibold text-gray-900">
                    {groupLabel}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {group.tabs.length} onglet{group.tabs.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => onMoveGroup(group.id, "up")}
                  disabled={groupIndex === 0}>
                  ↑ Monter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => onMoveGroup(group.id, "down")}
                  disabled={groupIndex === groups.length - 1}>
                  ↓ Descendre
                </Button>
                {!isUngrouped && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRemoveGroup(group.id)}>
                    Supprimer le groupe
                  </Button>
                )}
              </div>
            </div>

            {group.tabs.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                Aucun onglet dans ce groupe.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {group.tabs.map((tab, tabIndex) => (
                  <li
                    key={tab.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {tab.title || tab.url}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {tab.url}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        #{tabIndex + 1}
                      </span>
                      {tab.pinned && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                          Épinglé
                        </span>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => onMoveTab(group.id, tab.id, "up")}
                        disabled={tabIndex === 0}>
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => onMoveTab(group.id, tab.id, "down")}
                        disabled={tabIndex === group.tabs.length - 1}>
                        ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveTab(group.id, tab.id)}>
                        Retirer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
