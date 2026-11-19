/* Écran d'accueil commun aux applications Windows, macOS, Linux, Android et iOS.
 * Il mémorise les adresses de portails, vérifie qu'une adresse est bien un portail
 * (GET /api/health → { app: "portail-client" }), puis ouvre le portail dans la même
 * fenêtre. Rien d'autre que les adresses n'est stocké sur l'appareil.
 */
;(function () {
  'use strict'

  var KEY = 'portails'
  var LAST = 'dernier-portail'
  var params = new URLSearchParams(window.location.search)

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || '[]')
      return Array.isArray(data) ? data.filter(function (item) { return item && typeof item.url === 'string' }) : []
    } catch (e) {
      return []
    }
  }

  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch (e) { /* stockage indisponible */ }
  }

  function setLast(url) {
    try { url ? localStorage.setItem(LAST, url) : localStorage.removeItem(LAST) } catch (e) { /* idem */ }
  }

  function getLast() {
    try { return localStorage.getItem(LAST) } catch (e) { return null }
  }

  function isLocal(host) {
    return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
  }

  /** Normalise la saisie : ajoute https://, retire le chemin, refuse le http public. */
  function normalize(value) {
    var raw = String(value || '').trim()
    if (!raw) throw new Error('Saisissez l’adresse du portail.')
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw
    var url
    try { url = new URL(raw) } catch (e) { throw new Error('Cette adresse n’est pas valide.') }
    if (url.protocol === 'http:' && !isLocal(url.hostname)) {
      throw new Error('Pour votre sécurité, seules les adresses en https:// sont acceptées.')
    }
    return url.origin
  }

  function check(origin) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null
    var timer = setTimeout(function () { if (controller) controller.abort() }, 10000)
    return fetch(origin + '/api/health', { cache: 'no-store', signal: controller ? controller.signal : undefined })
      .then(function (response) { return response.json() })
      .then(function (data) {
        clearTimeout(timer)
        if (!data || data.app !== 'portail-client') throw new Error('not-portal')
        return data
      })
      .catch(function (error) {
        clearTimeout(timer)
        if (error && error.message === 'not-portal') {
          throw new Error('Cette adresse répond, mais ce n’est pas un portail client.')
        }
        throw new Error('Portail injoignable. Vérifiez l’adresse et votre connexion.')
      })
  }

  function open(origin) {
    setLast(origin)
    var list = load()
    list.forEach(function (item) { if (item.url === origin) item.openedAt = Date.now() })
    save(list)
    window.location.href = origin + '/'
  }

  function render() {
    var list = load().sort(function (a, b) { return (b.openedAt || 0) - (a.openedAt || 0) })
    var section = document.getElementById('liste-section')
    var ul = document.getElementById('liste')
    ul.textContent = ''
    section.hidden = list.length === 0
    document.getElementById('ajout-titre').textContent = list.length ? 'Ajouter un autre portail' : 'Ajouter un portail'

    list.forEach(function (item) {
      var li = document.createElement('li')
      var openBtn = document.createElement('button')
      openBtn.type = 'button'
      openBtn.className = 'row'
      var name = document.createElement('span')
      name.className = 'row-name'
      name.textContent = new URL(item.url).hostname
      var sub = document.createElement('span')
      sub.className = 'row-sub'
      sub.textContent = item.url
      openBtn.appendChild(name)
      openBtn.appendChild(sub)
      openBtn.addEventListener('click', function () { open(item.url) })

      var remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'remove'
      remove.setAttribute('aria-label', 'Retirer ' + item.url)
      remove.textContent = 'Retirer'
      remove.addEventListener('click', function () {
        save(load().filter(function (other) { return other.url !== item.url }))
        if (getLast() === item.url) setLast(null)
        render()
      })

      li.appendChild(openBtn)
      li.appendChild(remove)
      ul.appendChild(li)
    })
  }

  document.getElementById('ajout').addEventListener('submit', function (event) {
    event.preventDefault()
    var input = document.getElementById('adresse')
    var error = document.getElementById('erreur')
    var button = document.getElementById('valider')
    error.hidden = true

    var origin
    try { origin = normalize(input.value) } catch (e) {
      error.textContent = e.message
      error.hidden = false
      return
    }

    button.disabled = true
    button.textContent = 'Vérification…'
    check(origin)
      .then(function () {
        var list = load()
        if (!list.some(function (item) { return item.url === origin })) {
          list.push({ url: origin, addedAt: Date.now(), openedAt: Date.now() })
          save(list)
        }
        open(origin)
      })
      .catch(function (e) {
        error.textContent = e.message
        error.hidden = false
        button.disabled = false
        button.textContent = 'Ouvrir le portail'
      })
  })

  // Retour automatique après un échec de chargement (portail hors ligne, DNS…).
  var failure = params.get('erreur')
  if (failure) {
    var box = document.getElementById('erreur')
    box.textContent = 'Le portail n’a pas pu s’ouvrir (' + failure.slice(0, 80) + '). Vérifiez votre connexion puis réessayez.'
    box.hidden = false
  }

  // Lien direct depuis l'appli : ?ajouter=https://… pré-remplit le formulaire.
  var prefill = params.get('ajouter')
  if (prefill) document.getElementById('adresse').value = prefill

  // Au lancement, on rouvre le dernier portail consulté, sauf si l'utilisateur
  // vient du bouton « Mes portails » (?choisir=1).
  var last = getLast()
  if (!params.has('choisir') && !prefill && last && load().some(function (item) { return item.url === last })) {
    window.location.replace(last + '/')
    return
  }

  render()
})()
