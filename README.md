# Open Tabs - Chrome Extension

Manage your tabs and tab groups efficiently.

## Features

### 🎯 Tab Group Management
- Create themed tab groups to better organize your browsing
- Assign colors to each group for quick visual identification
- Name your groups according to your needs (work, projects, leisure, etc.)

### 🚀 Quick Tab Addition
- **Simple Mode**: Click the extension icon and select a group to add the current tab
- **Context Menu**: Right-click on any page to add it to a group
- Easily import web pages into your browsing groups

### 📋 Smart Organization
- Sort tabs within each group by:
  - **Name**: Alphabetical sorting of titles
  - **Date**: Addition order (default)
  - **URL**: Alphabetical sorting of web addresses

### 🎨 Dark Theme
- Automatically switch between light and dark themes
- The extension adapts to your system for optimal visual comfort

## Development

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Plasmo
- **Package Manager**: pnpm
- **Testing**: Jest + React Testing Library (configured)

### Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── SearchBar.tsx
│   │   └── ...
│   ├── business/              # Business logic components
│   │   ├── TabGroupManager.tsx
│   │   ├── SearchManager.tsx
│   │   ├── ImportExportManager.tsx
│   │   └── ...
│   ├── Popup/                 # Popup-specific components
│   │   ├── PopupContainer.tsx
│   │   ├── PopupHeader.tsx
│   │   └── ...
│   └── Options/               # Options page components
│       ├── OptionsContainer.tsx
│       ├── OptionsHeader.tsx
│       └── ...
├── hooks/                     # Custom React hooks
│   ├── useModal.ts
│   ├── useSearch.ts
│   ├── useTabManagement.ts
│   ├── useImportExport.ts
│   ├── useStorage.ts          # Plasmo storage hook
│   └── useTheme.ts
├── hooks/services/            # Service classes
│   ├── notificationService.ts
│   └── errorService.ts
├── types/                     # TypeScript type definitions
│   ├── components.ts
│   └── index.ts
├── constants/                 # Application constants
│   └── index.ts
├── popup.tsx                  # Main popup component
├── options.tsx                # Options page component
├── background.ts              # Background service worker
└── style.css                  # Global styles
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production

# Testing
pnpm test             # Run tests in watch mode
pnpm test:ci          # Run tests once
pnpm test:coverage    # Run tests with coverage report

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format code with Prettier
pnpm type-check       # Run TypeScript type checking

# Build
pnpm build            # Build for production
pnpm build:dev        # Build for development
pnpm clean            # Clean build artifacts
```

### Component Architecture

#### UI Components (`components/ui/`)
- Reusable, presentational components
- Follow the Compound Component pattern
- Include proper TypeScript types
- Support accessibility features

#### Business Components (`components/business/`)
- Handle business logic and data management
- Use custom hooks for complex operations
- Integrate with Chrome APIs
- Manage state and side effects

#### Custom Hooks (`hooks/`)
- Encapsulate reusable logic
- Follow React best practices
- Include proper TypeScript types
- Handle error boundaries

#### Services (`hooks/services/`)
- Singleton service classes
- Handle cross-cutting concerns
- Provide consistent APIs
- Support dependency injection

### Testing Strategy

- **Unit Tests**: Test individual components and hooks in isolation
- **Integration Tests**: Test component interactions and API calls
- **E2E Tests**: Test complete user flows (planned for future)
- **Visual Tests**: Ensure UI consistency (planned for future)

### Chrome API Integration

The extension uses several Chrome APIs:
- **tabs**: Tab management and organization
- **tabGroups**: Group creation and management
- **storage**: Persistent data storage
- **contextMenus**: Right-click menu integration
- **notifications**: User notifications
- **runtime**: Message passing between components

### State Management

- **Local State**: React useState/useReducer for component state
- **Global State**: Plasmo useStorage for persistent data
- **Chrome Storage**: Sync settings across devices
- **Message Passing**: Communication between popup and background

### Styling Approach

- **Tailwind CSS**: Utility-first CSS framework
- **Component-Scoped**: Each component has its own styles
- **Theme Support**: Built-in dark/light theme support
- **Responsive**: Mobile-first responsive design

## How it works?

### Installation
1. Download the extension from the Chrome Web Store
2. Accept the necessary permissions (tabs, tab groups, storage)
3. The extension icon will appear in your Chrome toolbar

### Usage

#### Create a tab group
1. Click the extension icon in your toolbar
2. Click "Create a group"
3. Give your group a name and choose a color
4. Validate to create your first group

#### Add a tab to a group
**From the extension:**
- Navigate to the page you want to add
- Click the extension icon
- Click the "+" button of the group where you want to add the tab

**From the context menu:**
- Right-click on any web page
- Select "Add this page to a group"
- Choose the destination group

#### Open a tab group
1. Click the extension icon
2. Click the "Open" button of the desired group
3. All tabs in the group will open in a new window, organized by color

#### Sort tabs in a group
1. Click the extension icon
2. Click the "Sort" button in a group
3. Choose your sorting method (Name, Date, URL)

### Customization
- **Rename a group**: Click on the group name to edit it
- **Change color**: Click on the color circle to choose a new one
- **Delete a group**: Use the delete button (🗑️) in the options

### Settings
Access the extension options to:
- Switch between simple and advanced mode
- Configure default behavior
- Enable or disable automatic opening of new tabs

## Required Permissions

- **Tabs**: To manage tab opening and organization
- **Tab Groups**: To create and organize colored tab groups
- **Storage**: To save your groups and preferences
- **Context Menus**: To add pages from right-click
- **Notifications**: To inform you of important actions

## Usage Tips

- Use groups to separate your activities (work, personal projects, research)
- Assign consistent colors to quickly find your groups
- Date sorting preserves the order in which you added tabs
- Simple mode is sufficient for daily use, advanced mode offers more control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

---

This extension was developed with ❤️ to improve your productivity and organization.