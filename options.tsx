import React, { useMemo, useState } from 'react'

import './options.css'
import './style.css'

import {
  ImportExportManager,
  NotificationManager,
  ProfileManager,
  SettingsManager,
  TabGroupManager
} from "~/components/business"
import {
  OptionsContainer,
  OptionsHeader,
  OptionsNavigation,
  OptionsSection
} from "~/components/Options"
import { Button } from "~/components/ui/Button"
import { useProfiles } from "~/hooks/useProfiles"
import { useStorage } from "~/hooks/useStorage"
import type { ProfileSummary } from "~/types"

type SectionId = "profiles" | "groups" | "import-export" | "settings"

interface MetricCard {
  id: string
  label: string
  value: string
  helper: string
}

const iconClassName = "w-4 h-4"

const ProfilesIcon = () => (
  <svg
    className={iconClassName}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M17 20c0-3.866-3.582-7-8-7s-8 3.134-8 7M21 20v-2m0 0a3 3 0 10-6 0v2m6-2v2m-9-9a4 4 0 100-8 4 4 0 000 8zm7 0a4 4 0 100-8 4 4 0 000 8z"
    />
  </svg>
)

const GroupsIcon = () => (
  <svg
    className={iconClassName}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.8} />
    <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.8} />
    <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.8} />
    <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.8} />
  </svg>
)

const ImportIcon = () => (
  <svg
    className={iconClassName}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 3v12m0 0l4-4m-4 4l-4-4m-2 9h12a2 2 0 002-2v-3M5 21a2 2 0 01-2-2v-3"
    />
  </svg>
)

const SettingsIcon = () => (
  <svg
    className={iconClassName}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.3.814 2.36 2.357a1.724 1.724 0 001.066 2.574c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.814 3.3-2.357 2.36a1.724 1.724 0 00-2.574 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.3-.814-2.36-2.357a1.724 1.724 0 00-1.066-2.574c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.814-3.3 2.357-2.36.996.607 2.273.02 2.573-1.066z"
    />
    <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
  </svg>
)

const SECTION_METADATA: Record<
  SectionId,
  { title: string; description: string }
> = {
  profiles: {
    title: "Profils de navigation",
    description:
      "Capturez et restaurez vos sessions complètes d’onglets, organisez-les par profil et passez de l’une à l’autre en un clic."
  },
  groups: {
    title: "Groupes d’onglets enregistrés",
    description:
      "Administrez vos collections d’onglets réutilisables, mettez-les à jour et gardez vos contextes de travail organisés."
  },
  "import-export": {
    title: "Import & Export",
    description:
      "Sauvegardez l’ensemble de votre configuration ou restaurez-la à partir d’un fichier JSON en toute sécurité."
  },
  settings: {
    title: "Paramètres de l’extension",
    description:
      "Affinez le comportement d’Open Tabs, les thèmes, les notifications et les options avancées."
  }
}

const numberFormatter = new Intl.NumberFormat("fr-FR")

const getLatestProfileUpdate = (summaries: ProfileSummary[]) => {
  if (summaries.length === 0) {
    return null
  }

  const latestTimestamp = summaries.reduce((latest, profile) => {
    const timestamp = new Date(profile.updatedAt).getTime()
    return timestamp > latest ? timestamp : latest
  }, 0)

  return new Date(latestTimestamp).toLocaleString()
}

function OptionsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("profiles")

  const { summaries, isLoading: areProfilesLoading } = useProfiles()
  const { groups, loading: areGroupsLoading } = useStorage()

  const metrics = useMemo<MetricCard[]>(() => {
    const profileCount = areProfilesLoading
      ? "…"
      : numberFormatter.format(summaries.length)
    const totalProfileTabs = areProfilesLoading
      ? "…"
      : numberFormatter.format(
          summaries.reduce((total, profile) => total + profile.tabCount, 0)
        )
    const groupCount = areGroupsLoading
      ? "…"
      : numberFormatter.format(groups.length)
    const totalGroupTabs = areGroupsLoading
      ? "…"
      : numberFormatter.format(
          groups.reduce((total, group) => total + (group.urls?.length ?? 0), 0)
        )

    const latestProfileUpdate = areProfilesLoading
      ? null
      : getLatestProfileUpdate(summaries)

    return [
      {
        id: "profiles",
        label: "Profils enregistrés",
        value: profileCount,
        helper: areProfilesLoading
          ? "Synchronisation des profils en cours…"
          : latestProfileUpdate
            ? `Dernière sauvegarde le ${latestProfileUpdate}`
            : "Capturez votre première session pour créer un profil."
      },
      {
        id: "profile-tabs",
        label: "Onglets capturés",
        value: totalProfileTabs,
        helper: areProfilesLoading
          ? "Chargement des métadonnées…"
          : summaries.length > 0
            ? "Total des onglets stockés dans vos profils."
            : "Aucun onglet sauvegardé pour le moment."
      },
      {
        id: "groups",
        label: "Groupes d’onglets",
        value: groupCount,
        helper: areGroupsLoading
          ? "Chargement des groupes enregistrés…"
          : groups.length > 0
            ? `${totalGroupTabs} onglet${totalGroupTabs === "1" ? "" : "s"} disponibles à l’ouverture.`
            : "Créez un groupe pour centraliser vos URL favorites."
      }
    ]
  }, [areGroupsLoading, areProfilesLoading, groups, summaries])

  const navigationItems = useMemo(
    () => [
      {
        id: "profiles" as SectionId,
        label: "Profils",
        icon: <ProfilesIcon />,
        badge:
          areProfilesLoading || summaries.length === 0
            ? undefined
            : summaries.length
      },
      {
        id: "groups" as SectionId,
        label: "Groupes",
        icon: <GroupsIcon />,
        badge:
          areGroupsLoading || groups.length === 0 ? undefined : groups.length
      },
      {
        id: "import-export" as SectionId,
        label: "Import & Export",
        icon: <ImportIcon />
      },
      {
        id: "settings" as SectionId,
        label: "Paramètres",
        icon: <SettingsIcon />
      }
    ],
    [areGroupsLoading, areProfilesLoading, groups.length, summaries.length]
  )

  const sectionMeta = SECTION_METADATA[activeSection]

  const handleSupportClick = () => {
    const supportUrl = "https://github.com/Nolyo/open-tabs/issues/new/choose"
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs
        .create({ url: supportUrl })
        .catch(() => window.open(supportUrl, "_blank"))
    } else {
      window.open(supportUrl, "_blank")
    }
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "profiles":
        return <ProfileManager />
      case "groups":
        return <TabGroupManager />
      case "import-export":
        return <ImportExportManager />
      case "settings":
        return <SettingsManager />
      default:
        return null
    }
  }

  return (
    <OptionsContainer className="bg-gray-50 min-h-screen pb-16">
      <NotificationManager />

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 px-8 py-10 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Tableau de bord Open Tabs
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
              Gérez vos profils de navigation, vos groupes d’onglets et
              l’ensemble des paramètres de l’extension depuis une interface
              unifiée.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={handleSupportClick}>
              Signaler un souci
            </Button>
            <Button
              variant="ghost"
              className="text-white/80 hover:bg-white/10"
              onClick={() => chrome.runtime.openOptionsPage?.()}>
              Recharger la page
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="mt-10 space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <OptionsNavigation
            items={navigationItems}
            activeItem={activeSection}
            onItemChange={setActiveSection}
            className="flex-wrap gap-y-2"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="text-sm font-medium text-gray-500">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metric.value}
              </p>
              <p className="mt-3 text-sm text-gray-500">{metric.helper}</p>
            </div>
          ))}
        </div>

        <OptionsSection
          title={sectionMeta.title}
          description={sectionMeta.description}
          padding="lg"
          className="border border-gray-200 bg-white">
          <div className="mt-6">{renderActiveSection()}</div>
        </OptionsSection>
      </div>
    </OptionsContainer>
  )
}

export default OptionsPage
