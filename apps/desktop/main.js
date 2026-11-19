// Application de bureau « Portail Client » (Windows, macOS, Linux).
// Une fenêtre unique qui affiche l'écran « Mes portails » puis le portail choisi.
// Sécurité : aucun accès Node.js pour les pages, bac à sable activé, liens externes
// ouverts dans le navigateur du système, navigation limitée au portail ouvert.
const { app, BrowserWindow, Menu, shell, session } = require('electron')
const path = require('node:path')

const SHELL = path.join(__dirname, 'shell', 'index.html')
const PARTITION = 'persist:portail'
const HOME_URL = 'portail-app://accueil'

let win = null

function openHome(choose = true) {
  if (!win) return
  win.loadFile(SHELL, choose ? { query: { choisir: '1' } } : undefined)
}

function isAllowedNavigation(currentUrl, targetUrl) {
  let current
  let target
  try {
    current = new URL(currentUrl)
    target = new URL(targetUrl)
  } catch {
    return false
  }
  if (target.protocol === 'file:') return target.pathname.endsWith('/shell/index.html')
  if (target.protocol !== 'https:' && target.protocol !== 'http:') return false
  // Depuis l'écran d'accueil on peut ouvrir n'importe quel portail ; ensuite on reste sur son domaine.
  if (current.protocol === 'file:' || currentUrl === '' || currentUrl === 'about:blank') return true
  return current.origin === target.origin
}

function openExternal(url) {
  if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 380,
    minHeight: 520,
    title: 'Portail Client',
    backgroundColor: '#f6f6f4',
    autoHideMenuBar: process.platform !== 'darwin',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: true,
    },
  })

  const contents = win.webContents
  contents.setUserAgent(`${contents.getUserAgent()} PortailClientApp/desktop`)

  contents.on('will-navigate', (event, url) => {
    if (url.startsWith(HOME_URL)) {
      event.preventDefault()
      openHome(true)
      return
    }
    if (!isAllowedNavigation(contents.getURL(), url)) {
      event.preventDefault()
      openExternal(url)
    }
  })

  contents.on('will-redirect', (event, url) => {
    if (!isAllowedNavigation(contents.getURL(), url)) {
      event.preventDefault()
      openExternal(url)
    }
  })

  contents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })

  contents.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
    // -3 = navigation annulée (normal). Sinon on revient à l'accueil avec un message.
    if (!isMainFrame || code === -3 || url.startsWith('file:')) return
    win.loadFile(SHELL, { query: { choisir: '1', erreur: description } })
  })

  openHome(false)
  win.on('closed', () => {
    win = null
  })
}

function buildMenu() {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Portail',
      submenu: [
        { label: 'Mes portails', accelerator: 'CmdOrCtrl+Shift+P', click: () => openHome(true) },
        { label: 'Actualiser', accelerator: 'CmdOrCtrl+R', click: () => win && win.webContents.reload() },
        { label: 'Précédent', accelerator: isMac ? 'Cmd+[' : 'Alt+Left', click: () => win && win.webContents.navigationHistory.goBack() },
        { type: 'separator' },
        { label: 'Imprimer…', accelerator: 'CmdOrCtrl+P', click: () => win && win.webContents.print() },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Fermer la fenêtre' } : { role: 'quit', label: 'Quitter' },
      ],
    },
    { role: 'editMenu', label: 'Édition' },
    {
      label: 'Affichage',
      submenu: [
        { role: 'resetZoom', label: 'Taille réelle' },
        { role: 'zoomIn', label: 'Agrandir' },
        { role: 'zoomOut', label: 'Réduire' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Site du projet',
          click: () => shell.openExternal('https://github.com/ck526438-lgtm/git-client-portal'),
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    // Aucune permission sensible (caméra, micro, position…) n'est accordée aux pages.
    session.fromPartition(PARTITION).setPermissionRequestHandler((_wc, permission, callback) => {
      callback(permission === 'clipboard-sanitized-write' || permission === 'notifications')
    })
    buildMenu()
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
