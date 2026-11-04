(() => {
  const side = document.querySelector('.side')
  const controls = document.querySelector('.headerActions')
  const menu = document.createElement('button')
  menu.id = 'biomeMenu'
  menu.type = 'button'
  menu.textContent = '植被类型'
  menu.setAttribute('aria-controls', 'atlas-biomes')
  side.id = 'atlas-biomes'
  controls.prepend(menu)
  const compact = matchMedia('(max-width: 700px)')
  function setMenu(open) {
    side.hidden = compact.matches && !open
    menu.setAttribute('aria-expanded', String(!side.hidden))
  }
  menu.addEventListener('click', () => setMenu(side.hidden))
  compact.addEventListener('change', () => setMenu(false))
  document.querySelectorAll('[data-biome]').forEach(button => {
    button.addEventListener('click', () => setMenu(false))
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && compact.matches && !side.hidden) {
      setMenu(false)
      menu.focus()
    }
  })
  document.querySelectorAll('button').forEach(button => {
    if (!button.title) button.title = button.textContent.trim()
  })
  setMenu(false)
  document.documentElement.dataset.ready = 'true'
  if (parent !== window) parent.postMessage({ type: 'geovoya:atlas-ready' }, location.origin)
})()
