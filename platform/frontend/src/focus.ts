export function focusIfActive(element?: HTMLElement | null) {
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    element?.focus({ preventScroll: true })
  }
}
