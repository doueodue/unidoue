/* Yon menyu belgilari: har bir bo'lim uchun alohida, ikki qatlamli (chiziq + rangli urg'u) belgi.
 * [chiziq yo'li, urg'u yo'li]. Urg'u --brand rangida to'ldiriladi (fasl mavzusi bilan almashadi), faol bo'limda yorqinroq. */
const NAV_IC = {
  dashboard: ['M3.5 11.4 12 4l8.5 7.4M5.5 10v8.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V10', 'M10 20v-4.5a2 2 0 0 1 4 0V20z'],
  finder: ['M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM10.5 7.4 14.4 9.3 10.5 11.2 6.6 9.3zM8.4 10.6v2c1 1 3.2 1 4.2 0v-2', 'M14.1 15.9 15.9 14.1 21.1 19.3 19.3 21.1z'],
  scholarships: ['M4.5 11v8.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V11M3 7.5h18V11H3zM12 7.5V21', 'M12 7.5c-1-3-3-4.2-4.5-3.4S8 7.5 12 7.5zM12 7.5c1-3 3-4.2 4.5-3.4S16 7.5 12 7.5z'],
  predictor: ['M12 3.5a8.5 8.5 0 1 0 8.5 8.5M12 7.5a4.5 4.5 0 1 0 4.5 4.5M12 12 20 4M17 4h3v3', 'M12 10.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z'],
  compare: ['M12 4v16M7.5 20h9M4.5 7.5 12 5.5l7.5 2M4.5 7.5 2 13.2M4.5 7.5 7 13.2M19.5 7.5 17 13.2M19.5 7.5l2.5 5.7', 'M2 13.2h5a2.5 2.6 0 0 1-5 0zM17 13.2h5a2.5 2.6 0 0 1-5 0z'],
  tracker: ['M9 5H7a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17 5h-2M9.5 12.8l2 2 3.6-4', 'M9 3.5h6a1 1 0 0 1 1 1V6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z'],
  roadmap: ['M5.5 19.5c5.5 0 1-6.5 6.5-6.5 3.2 0 2.5-3.5 4.8-5.4M5.5 17.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM17.2 3a3.3 3.3 0 0 0-3.3 3.3c0 2.4 3.3 5.2 3.3 5.2s3.3-2.8 3.3-5.2A3.3 3.3 0 0 0 17.2 3z', 'M17.2 3a3.3 3.3 0 0 0-3.3 3.3c0 2.4 3.3 5.2 3.3 5.2s3.3-2.8 3.3-5.2A3.3 3.3 0 0 0 17.2 3z'],
  guide: ['M7.5 3H14l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3zM14 3v5h5M9 13h6M9 16.5h4', 'M14 3l5 5h-5z'],
  essay: ['M4 20.2 5 16 16.6 4.4a2.1 2.1 0 0 1 3 3L8 19l-4 1.2zM14.6 6.4l3 3', 'M4 20.2 5 16l3 3-4 1.2z'],
  mentor: ['M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h-.5A2.5 2.5 0 0 1 4 13.5z', 'M12 6.6l1.05 2.35 2.35 1.05-2.35 1.05L12 13.4l-1.05-2.35L8.6 10l2.35-1.05z'],
  portfolio: ['M5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4zM4 8.8h16M7 6.4h.01M9.6 6.4h.01M14 12.5h3M14 15.3h3M14 18h1.6', 'M7.2 12.2h4.6v5.6H7.2z'],
  pricing: ['M6.6 4h10.8L21 9.2 12 20.5 3 9.2zM3 9.2h18M9.4 9.2 12 20.5l2.6-11.3M9.4 9.2 11 4M14.6 9.2 13 4', 'M6.6 4h10.8L21 9.2H3z']
};
/** Menyu belgisi: bo'lim uchun maxsus belgi bo'lsa, ikki qatlamli SVG; aks holda fallback() natijasi. */
export const navIcon = (id, fallback) => {
  const d = NAV_IC[id];
  return d ? `<svg viewBox="0 0 24 24" class="ni" aria-hidden="true"><path class="ni-a" d="${d[1]}"/><path d="${d[0]}"/></svg>` : fallback();
};
export const NAV_IDS = Object.keys(NAV_IC);
