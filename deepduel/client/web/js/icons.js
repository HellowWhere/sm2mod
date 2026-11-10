/* Inline SVG icons and procedural item pictures (no image files needed). */
window.DD = window.DD || {};
(function () {
  const S = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;
  const st = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  let uid = 0;
  const id = (p) => p + (++uid);

  const coin = () => {
    const g = id('c');
    return S('0 0 24 24', `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#e0900f"/></linearGradient></defs>
      <circle cx="12" cy="12" r="10" fill="url(#${g})" stroke="#8a5206" stroke-width="1.4"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#b86e08" stroke-width="1.4"/>
      <path d="M12 8.2v7.6M9.8 10.2h4.4" stroke="#8a5206" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="8.4" cy="7.6" rx="2.6" ry="1.4" fill="#fff8" transform="rotate(-30 8.4 7.6)"/>`);
  };
  const gem = () => {
    const g = id('p');
    return S('0 0 24 24', `<defs><radialGradient id="${g}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#ffd6f4"/><stop offset="1" stop-color="#d457b6"/></radialGradient></defs>
      <circle cx="12" cy="12.5" r="9" fill="url(#${g})" stroke="#9b2e80" stroke-width="1.2"/><ellipse cx="8.8" cy="9" rx="2.8" ry="1.8" fill="#fff" opacity="0.85" transform="rotate(-30 8.8 9)"/>`);
  };
  const trophy = () => S('0 0 24 24', `<path d="M7 3h10v5a5 5 0 01-10 0z" fill="#ffd34d" stroke="#a86b00" stroke-width="1.3"/>
      <path d="M7 5H4v1.5A3.5 3.5 0 007.4 10M17 5h3v1.5a3.5 3.5 0 01-3.4 3.5" fill="none" stroke="#ffd34d" stroke-width="1.8"/>
      <path d="M10.5 13h3l.6 4h-4.2z" fill="#e0a10c"/><rect x="7.5" y="17" width="9" height="3.5" rx="1" fill="#c47f00" stroke="#7a4d00"/><path d="M9 5.5v2.5" stroke="#fff9" stroke-width="1.5" stroke-linecap="round"/>`);

  const ICONS = {
    coin, gem, trophy,
    server: () => S('0 0 24 24', `<g ${st}><path d="M12 13v8M8 21h8"/><circle cx="12" cy="11" r="2"/><path d="M7.8 6.8a6 6 0 000 8.4M16.2 6.8a6 6 0 010 8.4M5 4a10 10 0 000 14M19 4a10 10 0 010 14"/></g>`),
    back: () => S('0 0 24 24', `<g ${st}><path d="M15 5l-7 7 7 7"/></g>`),
    gear: () => S('0 0 24 24', `<g ${st}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.2 6.5l2.6 1.5M17.2 16l2.6 1.5M4.2 17.5l2.6-1.5M17.2 8l2.6-1.5"/><circle cx="12" cy="12" r="7"/></g>`),
    battle: () => S('0 0 24 24', `<g ${st}><path d="M4 20L14 10M14 10l2-6 4 4-6 2M20 20L10 10M10 10L8 4 4 8l6 2"/></g>`),
    wrench: () => S('0 0 24 24', `<g ${st}><path d="M14.7 6.3a4 4 0 015 5L18 13l-7 7a2.1 2.1 0 01-3-3l7-7z"/><path d="M14.7 6.3L11 3"/></g>`),
    torpedo: () => S('0 0 24 24', `<g ${st}><path d="M3 12h3l2-3h9a4 3 0 010 6H8l-2-3"/><path d="M3 9v6"/></g>`),
    crate: () => S('0 0 24 24', `<g ${st}><path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/></g>`),
    pass: () => S('0 0 24 24', `<g ${st}><path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M12 8.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/></g>`),
    shop: () => S('0 0 24 24', `<g ${st}><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 016 0v2"/></g>`),
    podium: () => S('0 0 24 24', `<g ${st}><path d="M3 20v-6h6v6M9 20V9h6v11M15 20v-8h6v8M2 20h20"/></g>`),
    flag: () => S('0 0 24 24', `<g ${st}><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></g>`),
    crosshair: () => S('0 0 24 24', `<g ${st}><circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></g>`),
    sonar: () => S('0 0 24 24', `<g ${st}><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7M5.5 5.5a9.2 9.2 0 000 13M18.5 5.5a9.2 9.2 0 010 13"/></g>`),
    bolt: () => S('0 0 24 24', `<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>`),
    lock: () => S('0 0 24 24', `<path fill="currentColor" d="M7 10V7a5 5 0 0110 0v3h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1h1zm2 0h6V7a3 3 0 00-6 0v3z"/>`),
    close: () => S('0 0 24 24', `<g ${st}><path d="M6 6l12 12M18 6L6 18"/></g>`),
    up: () => S('0 0 24 24', `<g ${st} stroke-width="3"><path d="M12 19V6M6 11l6-6 6 6"/></g>`),
    copy: () => S('0 0 24 24', `<g ${st}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/></g>`),
    rotate: () => S('0 0 24 24', `<g ${st}><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M2 14a8 8 0 006 7M22 10a8 8 0 00-6-7"/></g>`),
    star: () => S('0 0 24 24', `<path fill="currentColor" d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>`),
    hull: () => S('0 0 24 24', `<g ${st}><path d="M2 14c2-3 6-4 10-4s8 1 10 4c-2 2-6 3-10 3S4 16 2 14z"/><path d="M9 10V7h4l1 3"/></g>`),
    armor: () => S('0 0 24 24', `<g ${st}><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></g>`),
    propeller: () => S('0 0 24 24', `<g ${st}><circle cx="12" cy="12" r="2"/><path d="M12 10c-1-4 0-7 2-7s2 4-2 7zM14 12c4-1 7 0 7 2s-4 2-7-2zM12 14c1 4 0 7-2 7s-2-4 2-7zM10 12c-4 1-7 0-7-2s4-2 7 2z"/></g>`),
    rudders: () => S('0 0 24 24', `<g ${st}><path d="M4 12h12M16 12l4-6v12zM8 8l-3-4M8 16l-3 4"/></g>`),
    battery: () => S('0 0 24 24', `<g ${st}><rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M11 9l-2 3h3l-2 3"/></g>`),
    info: () => S('0 0 24 24', `<g ${st}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></g>`),
    clock: () => S('0 0 24 24', `<g ${st}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>`),
    skin: () => S('0 0 24 24', `<g ${st}><path d="M4 20c4 0 5-3 5-5l8-8a2.1 2.1 0 00-3-3l-8 8c-2 0-5 1-5 5"/><path d="M12 7l3 3"/></g>`),
    gift: () => S('0 0 24 24', `<g ${st}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"/></g>`),
  };

  /** Crate picture: a neat, symmetric chest. Metal and decoration depend on the rarity colour. */
  const CRATE_RARITY = { '#8fa7bd': 0, '#3fa9f5': 1, '#b46cff': 2, '#ffb52e': 3 };
  function crateSvg(color, open) {
    const rar = CRATE_RARITY[String(color).toLowerCase()] || 0;
    const sh = (hex, f) => (DD.color ? DD.color.shade(hex, f) : hex);
    const b = id('cb'), l = id('cl'), m = id('cm'), mv = id('cv'), g = id('cg');
    const gold = rar >= 2;
    const metal = gold ? ['#fff4c2', '#f3bd3c', '#a8670c'] : ['#f4f8fb', '#aab6c2', '#56636f'];
    const lidTop = open ? 4 : 16;
    const lid = open
      ? `<path d="M14,40 L18,6 Q19,2 26,2 H94 Q101,2 102,6 L106,40 Z" fill="url(#${l})" stroke="#000a" stroke-width="2" opacity="0.9"/>
         <path d="M20,44 H100 L92,58 H28 Z" fill="${sh(color, -0.6)}"/><path d="M28,58 H92 L100,44" fill="none" stroke="#fff6" stroke-width="1"/>
         <ellipse cx="60" cy="48" rx="34" ry="8" fill="#fff8d0" opacity="0.9"/>`
      : `<path d="M12,52 V34 Q12,${lidTop} 30,${lidTop} H90 Q108,${lidTop} 108,34 V52 Z" fill="url(#${l})" stroke="#000a" stroke-width="2"/>
         <path d="M20,32 Q21,${lidTop + 6} 32,${lidTop + 6} H88 Q99,${lidTop + 6} 100,32" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2.5" stroke-linecap="round"/>
         <path d="M14,40 H106" stroke="#0003" stroke-width="1.5"/>`;
    const strap = (x) => `<rect x="${x}" y="${open ? 50 : lidTop + 1}" width="11" height="${open ? 47 : 97 - lidTop}" rx="2" fill="url(#${mv})" stroke="#0009" stroke-width="1.2"/>
      ${[open ? 58 : lidTop + 8, 62, 90].map(y => `<circle cx="${x + 5.5}" cy="${y}" r="2" fill="${metal[0]}" stroke="#0007" stroke-width="0.8"/>`).join('')}`;
    const gem = rar >= 2 ? `<circle cx="60" cy="56" r="${rar === 3 ? 5 : 4}" fill="${rar === 3 ? '#ff3d5e' : '#7a3dff'}" stroke="#fff8" stroke-width="1.2"/><circle cx="58.5" cy="54.5" r="1.4" fill="#fff"/>`
      : `<circle cx="60" cy="54" r="2.8" fill="#2a1a05"/><rect x="58.8" y="55" width="2.4" height="7" rx="1" fill="#2a1a05"/>`;
    const sparkles = rar === 3 ? [[10, 14, 1], [110, 22, 0.8], [104, 92, 0.7], [16, 88, 0.6]].map(([x, y, s2]) =>
      `<path d="M${x},${y - 7 * s2} L${x + 1.8 * s2},${y - 1.8 * s2} L${x + 7 * s2},${y} L${x + 1.8 * s2},${y + 1.8 * s2} L${x},${y + 7 * s2} L${x - 1.8 * s2},${y + 1.8 * s2} L${x - 7 * s2},${y} L${x - 1.8 * s2},${y - 1.8 * s2} Z" fill="#fff6c8"/>`).join('') : '';
    return S('0 0 120 112', `<defs>
      <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(color, 0.15)}"/><stop offset="0.55" stop-color="${sh(color, -0.15)}"/><stop offset="1" stop-color="${sh(color, -0.6)}"/></linearGradient>
      <linearGradient id="${l}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(color, 0.55)}"/><stop offset="0.6" stop-color="${sh(color, 0.05)}"/><stop offset="1" stop-color="${sh(color, -0.25)}"/></linearGradient>
      <linearGradient id="${m}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${metal[0]}"/><stop offset="0.5" stop-color="${metal[1]}"/><stop offset="1" stop-color="${metal[2]}"/></linearGradient>
      <linearGradient id="${mv}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${metal[2]}"/><stop offset="0.35" stop-color="${metal[0]}"/><stop offset="0.7" stop-color="${metal[1]}"/><stop offset="1" stop-color="${metal[2]}"/></linearGradient>
      <radialGradient id="${g}"><stop offset="0" stop-color="${color}" stop-opacity="0.75"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
      ${rar >= 2 || open ? `<circle cx="60" cy="56" r="56" fill="url(#${g})"/>` : ''}
      <ellipse cx="60" cy="103" rx="48" ry="6" fill="#000" opacity="0.35"/>
      <rect x="14" y="50" width="92" height="48" rx="6" fill="url(#${b})" stroke="#000a" stroke-width="2"/>
      <path d="M16,66 H104 M16,82 H104" stroke="#0004" stroke-width="1.6"/>
      <path d="M18,53 H102" stroke="#fff3" stroke-width="1.2"/>
      ${lid}
      ${strap(24)}${strap(85)}
      <rect x="10" y="${open ? 44 : 46}" width="100" height="8" rx="3" fill="url(#${m})" stroke="#0009" stroke-width="1.2"/>
      <path d="M14,90 V98 H24 M106,90 V98 H96" fill="none" stroke="url(#${m})" stroke-width="4" stroke-linejoin="round"/>
      ${open ? '' : `<rect x="49" y="42" width="22" height="26" rx="5" fill="url(#${m})" stroke="#000a" stroke-width="1.4"/>${gem}`}
      ${sparkles}`);
  }

  /** League shield. */
  function shieldSvg(color, n) {
    const g = id('sh');
    return S('0 0 40 44', `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="0.35" stop-color="${color}"/><stop offset="1" stop-color="#0a1626"/></linearGradient></defs>
      <path d="M20 2 L36 8 V21 C36 31 29 38 20 42 C11 38 4 31 4 21 V8 Z" fill="url(#${g})" stroke="#000a" stroke-width="1.6"/>
      <path d="M20 7 L31 11 V21 C31 28 26 33 20 36 C14 33 9 28 9 21 V11 Z" fill="none" stroke="#fff8" stroke-width="1.2"/>
      <text x="20" y="27" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" stroke="#0008" stroke-width="0.8" font-family="Arial">${n}</text>`);
  }

  /** Weapon picture drawn from its render kind. */
  function weaponSvg(kind, color) {
    const c = color || '#9fb3c8';
    const metal = id('m'), glow = id('g');
    const defs = `<defs><linearGradient id="${metal}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f2fa"/><stop offset="0.5" stop-color="#8aa0b4"/><stop offset="1" stop-color="#3b4c5c"/></linearGradient>
      <radialGradient id="${glow}"><stop offset="0" stop-color="${c}" stop-opacity="0.9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`;
    const torpBody = (tip, extra = '') => `<rect x="10" y="26" width="38" height="12" rx="6" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/>
      <path d="M48 26 Q58 32 48 38 Z" fill="${tip}" stroke="#1b2733" stroke-width="1.5"/>
      <path d="M12 26 L5 20 L5 26 Z M12 38 L5 44 L5 38 Z" fill="#5d7084" stroke="#1b2733" stroke-width="1.2"/>
      <rect x="22" y="27" width="4" height="10" fill="${c}"/>${extra}`;
    const gunBase = `<rect x="6" y="34" width="22" height="14" rx="4" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><circle cx="17" cy="41" r="3.2" fill="${c}"/>`;
    let body;
    switch (kind) {
      case 'shell': body = gunBase + `<rect x="24" y="28" width="32" height="8" rx="2" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><path d="M56 32 l5 -3 v6z" fill="#e0a10c"/>`; break;
      case 'bullet': body = gunBase + `<rect x="24" y="26" width="30" height="4" rx="1" fill="url(#${metal})" stroke="#1b2733"/><rect x="24" y="31" width="30" height="4" rx="1" fill="url(#${metal})" stroke="#1b2733"/><rect x="24" y="36" width="30" height="4" rx="1" fill="url(#${metal})" stroke="#1b2733"/>`; break;
      case 'pellet': body = gunBase + `<path d="M24 30 L50 22 L54 30 L54 38 L50 46 L24 38 Z" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><circle cx="57" cy="26" r="2" fill="${c}"/><circle cx="59" cy="32" r="2" fill="${c}"/><circle cx="57" cy="38" r="2" fill="${c}"/>`; break;
      case 'sonic': body = gunBase + `<path d="M24 28 h14 l10 -8 v24 l-10 -8 h-14z" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><path d="M52 22 q6 10 0 20 M57 18 q8 14 0 28" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`; break;
      case 'cryo': body = gunBase + `<rect x="24" y="28" width="26" height="9" rx="3" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><path d="M55 32 l-4 0 M55 32 l3 -5 M55 32 l3 5 M55 32 l6 0" stroke="#bff3ff" stroke-width="2.4" stroke-linecap="round"/><circle cx="55" cy="32" r="7" fill="url(#${glow})"/>`; break;
      case 'rail': body = gunBase + `<rect x="22" y="26" width="38" height="3.5" fill="url(#${metal})" stroke="#1b2733"/><rect x="22" y="34.5" width="38" height="3.5" fill="url(#${metal})" stroke="#1b2733"/><rect x="24" y="30" width="34" height="4" fill="${c}" opacity="0.85"/><circle cx="60" cy="32" r="6" fill="url(#${glow})"/>`; break;
      case 'plasma': body = gunBase + `<rect x="24" y="28" width="22" height="9" rx="3" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><circle cx="53" cy="32" r="9" fill="url(#${glow})"/><circle cx="53" cy="32" r="4.5" fill="#eaffd9"/>`; break;
      case 'torp': body = torpBody('#d9372b'); break;
      case 'torp_fast': body = torpBody('#ffd34d', `<path d="M8 20 L16 24 M6 32 L12 32 M8 44 L16 40" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`); break;
      case 'torp_homing': body = torpBody('#ff6b3d', `<circle cx="52" cy="32" r="2.4" fill="#ff2a2a"/><path d="M54 18 a14 14 0 0 1 6 8" fill="none" stroke="${c}" stroke-width="2"/>`); break;
      case 'mine': body = `<circle cx="32" cy="34" r="14" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/>` +
        [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="30.5" y="13" width="3" height="8" fill="#5d7084" transform="rotate(${a} 32 34)"/>`).join('') +
        `<circle cx="32" cy="34" r="4" fill="#ff2a2a"/><circle cx="32" cy="34" r="9" fill="url(#${glow})" opacity="0.6"/>`; break;
      case 'torp_cluster': body = torpBody('#b46cff', `<rect x="30" y="27" width="3" height="10" fill="#1b2733"/><rect x="36" y="27" width="3" height="10" fill="#1b2733"/><circle cx="58" cy="22" r="2.5" fill="${c}"/><circle cx="60" cy="30" r="2.5" fill="${c}"/><circle cx="60" cy="38" r="2.5" fill="${c}"/>`); break;
      case 'torp_heavy': body = `<rect x="6" y="22" width="44" height="20" rx="10" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><path d="M50 22 Q62 32 50 42 Z" fill="#d9372b" stroke="#1b2733" stroke-width="1.5"/><rect x="20" y="23" width="6" height="18" fill="${c}"/><path d="M8 22 L2 14 L2 22 Z M8 42 L2 50 L2 42 Z" fill="#5d7084"/>`; break;
      case 'torp_emp': body = torpBody('#3dfcff', `<path d="M34 18 l-4 8 h5 l-3 8" fill="none" stroke="#ffe680" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="54" cy="32" r="7" fill="url(#${glow})"/>`); break;
      case 'twin': body = gunBase + `<rect x="24" y="25" width="32" height="6" rx="2" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.3"/><rect x="24" y="33" width="32" height="6" rx="2" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.3"/><path d="M56 28 l4 0 M56 36 l4 0" stroke="#ffd36b" stroke-width="3" stroke-linecap="round"/>`; break;
      case 'mortar': body = gunBase + `<path d="M20 36 L36 18 L46 26 L30 42 Z" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><ellipse cx="41" cy="22" rx="6" ry="4" transform="rotate(40 41 22)" fill="#2b3440"/><circle cx="52" cy="14" r="6" fill="#3a4450" stroke="#1b2733" stroke-width="1.2"/><path d="M55 9 l3 -4" stroke="#ffb03b" stroke-width="2" stroke-linecap="round"/>`; break;
      case 'acid': body = gunBase + `<rect x="24" y="28" width="26" height="8" rx="3" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><rect x="26" y="18" width="12" height="11" rx="3" fill="#7dff4d" stroke="#1b2733" stroke-width="1.2" opacity="0.9"/><path d="M54 30 q3 4 0 7 q-3 -3 0 -7z M59 38 q2 3 0 5 q-2 -2 0 -5z" fill="#9dff5d"/><circle cx="55" cy="32" r="7" fill="url(#${glow})"/>`; break;
      case 'ion': body = gunBase + `<rect x="24" y="28" width="30" height="8" rx="3" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/>${[29, 36, 43].map(x => `<rect x="${x}" y="25" width="3.5" height="14" rx="1.5" fill="#8a7dff" stroke="#1b2733" stroke-width="0.8"/>`).join('')}<circle cx="57" cy="32" r="6" fill="url(#${glow})"/><circle cx="57" cy="32" r="2.6" fill="#e0dcff"/>`; break;
      case 'vortex': body = gunBase + `<path d="M24 28 h12 l12 -8 v24 l-12 -8 h-12z" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><path d="M56 32 m-7 0 a7 7 0 1 1 7 7 a4.5 4.5 0 1 1 -4.5 -4.5 a2 2 0 1 1 2 2" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`; break;
      case 'tesla': body = gunBase + `<rect x="24" y="29" width="14" height="6" rx="2" fill="url(#${metal})" stroke="#1b2733"/><path d="M38 24 h4 v16 h-4z M44 22 h4 v20 h-4z" fill="#b87333" stroke="#1b2733" stroke-width="0.8"/><circle cx="52" cy="32" r="5" fill="url(#${metal})" stroke="#1b2733"/><path d="M55 30 l4 -6 l-1 6 l5 -2 l-6 10 l1 -6z" fill="#e8fbff" stroke="${c}" stroke-width="1"/><circle cx="58" cy="30" r="8" fill="url(#${glow})"/>`; break;
      case 'depth': body = `<rect x="20" y="16" width="24" height="34" rx="6" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.5"/><rect x="20" y="22" width="24" height="5" fill="#ffd34d"/><rect x="20" y="39" width="24" height="5" fill="#ffd34d"/><rect x="28" y="10" width="8" height="7" rx="2" fill="#5d7084" stroke="#1b2733"/><circle cx="32" cy="33" r="3" fill="#ff3030"/><path d="M32 52 v6 M26 54 v3 M38 54 v3" stroke="#bfefff" stroke-width="1.6" stroke-linecap="round"/>`; break;
      case 'torp_net': body = torpBody('#3fd26b', `<g stroke="#1b2733" stroke-width="0.9" opacity="0.8"><path d="M34 26 l8 12 M40 26 l8 12 M34 38 l8 -12 M40 38 l8 -12"/></g>`); break;
      case 'torp_ghost': body = `<g opacity="0.6">${torpBody('#c9a8ff')}</g><rect x="8" y="23" width="52" height="18" rx="9" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="3 3"/>`; break;
      case 'torp_swarm': body = [18, 32, 46].map(y => `<rect x="14" y="${y - 4}" width="30" height="8" rx="4" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.2"/><path d="M44 ${y - 4} Q51 ${y} 44 ${y + 4} Z" fill="#ff8a3d" stroke="#1b2733"/><path d="M15 ${y - 4} l-5 -3 v6 z" fill="#5d7084"/>`).join(''); break;
      case 'torp_shkval': body = `<ellipse cx="34" cy="32" rx="28" ry="10" fill="#e8fbff" opacity="0.35" stroke="#bfefff" stroke-width="1"/><rect x="8" y="28" width="46" height="8" rx="4" fill="url(#${metal})" stroke="#1b2733" stroke-width="1.4"/><path d="M54 28 L63 32 L54 36 Z" fill="#ffd34d" stroke="#1b2733"/><path d="M9 28 L3 23 L3 28 Z M9 36 L3 41 L3 36 Z" fill="#5d7084"/><rect x="20" y="29" width="3" height="6" fill="${c}"/><rect x="26" y="29" width="3" height="6" fill="${c}"/>`; break;
      default: body = `<circle cx="32" cy="32" r="12" fill="${c}"/>`;
    }
    return S('0 0 64 64', defs + `<circle cx="32" cy="32" r="30" fill="url(#${glow})" opacity="0.35"/>` + body);
  }

  function partIcon(id) {
    return ICONS[id] ? ICONS[id]() : ICONS.info();
  }

  function hydrate(root) {
    (root || document).querySelectorAll('i[data-icon]').forEach(el => {
      if (el.dataset.done) return;
      const f = ICONS[el.dataset.icon];
      if (f) { el.innerHTML = f(); el.dataset.done = '1'; }
    });
  }

  DD.icons = { ICONS, crateSvg, shieldSvg, weaponSvg, partIcon, hydrate, get: (n) => (ICONS[n] ? ICONS[n]() : '') };
})();
