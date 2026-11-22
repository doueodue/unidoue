/* Kun/tun almashtirgich tugmasi (HTML). Bosilishini js/theme.js boshqaradi ([data-theme-toggle] orqali). */
import { t } from './i18n.js';
const SUN = '<svg class="ts-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" fill="none"/></svg>';
const MOON = '<svg class="ts-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z"/></svg>';
export function themeSwitch() {
  const dark = !!window.UniTheme && window.UniTheme.get() === 'dark', label = t('Tungi rejim');
  return `<button type="button" class="theme-sw" role="switch" aria-checked="${dark}" aria-label="${label}" title="${label}" data-theme-toggle><span class="ts-bg" aria-hidden="true"><i class="ts-ct"></i><i class="ts-st"></i><i class="ts-cl"></i></span><span class="ts-knob">${SUN}${MOON}</span></button>`;
}
