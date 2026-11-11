/* Inline SVG icons and procedural item pictures (no image files needed). */
window.DD = window.DD || {};
(function () {
  const S = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;
  const st = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  let uid = 0;
  const id = (p) => p + (++uid);

  const coin = () => {
    const g = id('c'), r = id('cr');
    // gold coin with a small embossed submarine instead of a cross
    return S('0 0 24 24', `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset="0.5" stop-color="#ffc43a"/><stop offset="1" stop-color="#d9850c"/></linearGradient>
      <linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e09a14"/><stop offset="1" stop-color="#ffe27a"/></linearGradient></defs>
      <circle cx="12" cy="12" r="10.4" fill="url(#${g})" stroke="#8a5206" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="7.8" fill="url(#${r})" stroke="#b86e08" stroke-width="0.9"/>
      <g transform="translate(0 0.6)">
        <path d="M5.6 13.1 L4.4 11.4 L5.1 11.4 L6.6 12.6 Z M5.6 13.9 L4.4 15.6 L5.1 15.6 L6.6 14.4 Z" fill="#9a5d06"/>
        <path d="M10.2 11.2 L10.8 9 Q10.9 8.6 11.3 8.6 H13.3 Q13.7 8.6 13.8 9 L14.4 11.2 Z" fill="#9a5d06"/>
        <path d="M12.4 8.6 V7.4 H13.4" fill="none" stroke="#9a5d06" stroke-width="0.7" stroke-linecap="round"/>
        <path d="M7.6 11 H16.2 Q19 11 19.4 13.5 Q19 16 16.2 16 H7.6 Q5.8 16 5.8 13.5 Q5.8 11 7.6 11 Z" fill="#9a5d06"/>
        <path d="M7.8 11.7 H16 Q17.6 11.7 18.3 12.6" fill="none" stroke="#ffe9a0" stroke-width="0.6" stroke-linecap="round"/>
        <circle cx="14.2" cy="13.4" r="0.85" fill="#ffd968"/><circle cx="16.2" cy="13.4" r="0.85" fill="#ffd968"/>
      </g>
      <ellipse cx="8" cy="6.6" rx="3" ry="1.3" fill="#ffffff" opacity="0.6" transform="rotate(-30 8 6.6)"/>`);
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
  /**
   * part: 'all' (closed chest), 'body' (box with a dark open mouth) or 'lid' (lid + lock).
   * Body and lid share the same viewBox, so stacked on top of each other they form the chest,
   * and the lid layer can fly off when the chest is opened.
   */
  function crateSvg(color, part) {
    if (part === true) part = 'all';
    part = part || 'all';
    const rar = CRATE_RARITY[String(color).toLowerCase()] || 0;
    const sh = (hex, f) => (DD.color ? DD.color.shade(hex, f) : hex);
    const b = id('cb'), l = id('cl'), m = id('cm'), mv = id('cv'), g = id('cg');
    const gold = rar >= 2;
    const metal = gold ? ['#fff4c2', '#f3bd3c', '#a8670c'] : ['#f4f8fb', '#aab6c2', '#56636f'];
    const lidTop = 16;
    const rivets = (x, ys) => ys.map(y => `<circle cx="${x + 5.5}" cy="${y}" r="2" fill="${metal[0]}" stroke="#0007" stroke-width="0.8"/>`).join('');
    const strap = (x, y0, y1, ys) => `<rect x="${x}" y="${y0}" width="11" height="${y1 - y0}" rx="2" fill="url(#${mv})" stroke="#0009" stroke-width="1.2"/>${rivets(x, ys)}`;
    const gem = rar >= 2 ? `<circle cx="60" cy="56" r="${rar === 3 ? 5 : 4}" fill="${rar === 3 ? '#ff3d5e' : '#7a3dff'}" stroke="#fff8" stroke-width="1.2"/><circle cx="58.5" cy="54.5" r="1.4" fill="#fff"/>`
      : `<circle cx="60" cy="54" r="2.8" fill="#2a1a05"/><rect x="58.8" y="55" width="2.4" height="7" rx="1" fill="#2a1a05"/>`;
    const sparkles = rar === 3 && part === 'all' ? [[10, 14, 1], [110, 22, 0.8], [104, 92, 0.7], [16, 88, 0.6]].map(([x, y, s2]) =>
      `<path d="M${x},${y - 7 * s2} L${x + 1.8 * s2},${y - 1.8 * s2} L${x + 7 * s2},${y} L${x + 1.8 * s2},${y + 1.8 * s2} L${x},${y + 7 * s2} L${x - 1.8 * s2},${y + 1.8 * s2} L${x - 7 * s2},${y} L${x - 1.8 * s2},${y - 1.8 * s2} Z" fill="#fff6c8"/>`).join('') : '';
    const defs = `<defs>
      <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(color, 0.15)}"/><stop offset="0.55" stop-color="${sh(color, -0.15)}"/><stop offset="1" stop-color="${sh(color, -0.6)}"/></linearGradient>
      <linearGradient id="${l}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(color, 0.55)}"/><stop offset="0.6" stop-color="${sh(color, 0.05)}"/><stop offset="1" stop-color="${sh(color, -0.25)}"/></linearGradient>
      <linearGradient id="${m}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${metal[0]}"/><stop offset="0.5" stop-color="${metal[1]}"/><stop offset="1" stop-color="${metal[2]}"/></linearGradient>
      <linearGradient id="${mv}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${metal[2]}"/><stop offset="0.35" stop-color="${metal[0]}"/><stop offset="0.7" stop-color="${metal[1]}"/><stop offset="1" stop-color="${metal[2]}"/></linearGradient>
      <radialGradient id="${g}"><stop offset="0" stop-color="${color}" stop-opacity="0.75"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${g}i" cx="0.5" cy="0.2" r="0.9"><stop offset="0" stop-color="#fff6c8"/><stop offset="0.5" stop-color="${sh(color, 0.3)}"/><stop offset="1" stop-color="${sh(color, -0.7)}"/></radialGradient></defs>`;
    const body = `${rar >= 2 && part === 'all' ? `<circle cx="60" cy="56" r="56" fill="url(#${g})"/>` : ''}
      <ellipse cx="60" cy="103" rx="48" ry="6" fill="#000" opacity="0.35"/>
      <rect x="14" y="50" width="92" height="48" rx="6" fill="url(#${b})" stroke="#000a" stroke-width="2"/>
      <path d="M16,66 H104 M16,82 H104" stroke="#0004" stroke-width="1.6"/>
      <path d="M18,53 H102" stroke="#fff3" stroke-width="1.2"/>
      ${part === 'body' ? `<path d="M14,52 L22,40 H98 L106,52 Z" fill="url(#${g}i)" stroke="#000a" stroke-width="1.5"/>` : ''}
      ${strap(24, 50, 97, [62, 90])}${strap(85, 50, 97, [62, 90])}
      <rect x="10" y="46" width="100" height="8" rx="3" fill="url(#${m})" stroke="#0009" stroke-width="1.2"/>
      <path d="M14,90 V98 H24 M106,90 V98 H96" fill="none" stroke="url(#${m})" stroke-width="4" stroke-linejoin="round"/>`;
    const lid = `<path d="M12,52 V34 Q12,${lidTop} 30,${lidTop} H90 Q108,${lidTop} 108,34 V52 Z" fill="url(#${l})" stroke="#000a" stroke-width="2"/>
      <path d="M20,32 Q21,${lidTop + 6} 32,${lidTop + 6} H88 Q99,${lidTop + 6} 100,32" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M14,40 H106" stroke="#0003" stroke-width="1.5"/>
      ${strap(24, lidTop + 1, 52, [lidTop + 8, 44])}${strap(85, lidTop + 1, 52, [lidTop + 8, 44])}
      ${part === 'lid' ? `<rect x="10" y="46" width="100" height="5" rx="2" fill="url(#${m})" stroke="#0009" stroke-width="1"/>` : ''}
      <rect x="49" y="42" width="22" height="26" rx="5" fill="url(#${m})" stroke="#000a" stroke-width="1.4"/>${gem}`;
    if (part === 'body') return S('0 0 120 112', defs + body);
    if (part === 'lid') return S('0 0 120 112', defs + lid);
    return S('0 0 120 112', defs + body + lid + sparkles);
  }

  /** League shield. */
  function shieldSvg(color, n) {
    const g = id('sh');
    return S('0 0 40 44', `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="0.35" stop-color="${color}"/><stop offset="1" stop-color="#0a1626"/></linearGradient></defs>
      <path d="M20 2 L36 8 V21 C36 31 29 38 20 42 C11 38 4 31 4 21 V8 Z" fill="url(#${g})" stroke="#000a" stroke-width="1.6"/>
      <path d="M20 7 L31 11 V21 C31 28 26 33 20 36 C14 33 9 28 9 21 V11 Z" fill="none" stroke="#fff8" stroke-width="1.2"/>
      <text x="20" y="27" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" stroke="#0008" stroke-width="0.8" font-family="Arial">${n}</text>`);
  }

  /** Detailed weapon picture drawn from its render kind (64x64). */
  /* Weapon pictures are files: img/weapons/<kind>.png. Kinds without a file use the built-in drawing below. */
  const WEAPON_PNG = ('shell bullet twin pellet sonic mortar acid cryo ion vortex rail plasma tesla torp torp_fast torp_homing ' +
    'torp_net torp_cluster torp_heavy torp_ghost torp_emp torp_swarm torp_shkval depth mine').split(' ');
  function weaponSvg(kind, color) {
    if (WEAPON_PNG.indexOf(kind) >= 0) return S('0 0 64 64', `<image href="img/weapons/${kind}.png" x="0" y="0" width="64" height="64"/>`);
    const c = color || '#9fb3c8';
    const shd = (hex, f) => (DD.color ? DD.color.shade(hex, f) : hex);
    const m = id('m'), md = id('md'), br = id('br'), gl = id('g'), cg = id('cg'), cu = id('cu');
    const defs = `<defs>
      <linearGradient id="${m}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9fc"/><stop offset="0.35" stop-color="#b3c0cc"/><stop offset="0.7" stop-color="#66747f"/><stop offset="1" stop-color="#2e3a44"/></linearGradient>
      <linearGradient id="${md}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b99a7"/><stop offset="0.5" stop-color="#465360"/><stop offset="1" stop-color="#1c242c"/></linearGradient>
      <linearGradient id="${br}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset="0.5" stop-color="#e6b23a"/><stop offset="1" stop-color="#8a5a06"/></linearGradient>
      <linearGradient id="${cu}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd0a0"/><stop offset="0.5" stop-color="#c27a3a"/><stop offset="1" stop-color="#6a3a14"/></linearGradient>
      <linearGradient id="${cg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shd(c, 0.55)}"/><stop offset="0.5" stop-color="${c}"/><stop offset="1" stop-color="${shd(c, -0.55)}"/></linearGradient>
      <radialGradient id="${gl}"><stop offset="0" stop-color="${c}" stop-opacity="0.95"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`;
    const K = '#141c24';
    const bolt = (x, y) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#d7e0e8" stroke="${K}" stroke-width="0.5"/>`;
    const hl = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="1.1" rx="0.5" fill="#fff" opacity="0.65"/>`;
    // gun turret: base plate, slewing ring, armoured housing with a status light
    const turret = () => `<path d="M3 51 H31 L28 57 H6 Z" fill="url(#${md})" stroke="${K}" stroke-width="1"/>${bolt(8, 54)}${bolt(17, 54)}${bolt(26, 54)}
      <ellipse cx="17" cy="50" rx="13" ry="3.2" fill="url(#${m})" stroke="${K}" stroke-width="0.9"/>
      <path d="M7 49 V39 Q7 33 13 33 H25 Q30 33 30 38 V49 Z" fill="url(#${m})" stroke="${K}" stroke-width="1.2"/>
      <path d="M8 44 H29" stroke="${K}" stroke-opacity="0.35" stroke-width="0.8"/>${hl(10, 35, 16)}
      <path d="M10 46.5 h6 M10 48 h6" stroke="${K}" stroke-opacity="0.5" stroke-width="0.7"/>
      <circle cx="23.5" cy="40" r="4.5" fill="url(#${gl})" opacity="0.8"/><circle cx="23.5" cy="40" r="2.2" fill="url(#${cg})" stroke="${K}" stroke-width="0.6"/>`;
    const barrel = (x, y, len, h, muzzle) => `<rect x="${x}" y="${y}" width="${len}" height="${h}" rx="${h / 3}" fill="url(#${m})" stroke="${K}" stroke-width="1"/>
      ${hl(x + 2, y + 1, len - 6)}<rect x="${x + len * 0.35}" y="${y - 0.6}" width="2" height="${h + 1.2}" fill="url(#${md})"/>
      ${muzzle !== false ? `<rect x="${x + len - 4}" y="${y - 1.4}" width="5" height="${h + 2.8}" rx="1.2" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/>` : ''}`;
    // torpedo body with nose cone, warhead band, panel lines, rivets, fins and propeller
    const torpedo = (tip, opts) => {
      opts = opts || {};
      const y = opts.y || 32, h = opts.h || 7, x0 = opts.x0 || 10, x1 = opts.x1 || 46, n = opts.nose || 12;
      return `<path d="M${x0 + 3} ${y - h} L${x0 - 3} ${y - h - 8} L${x0} ${y - h - 8} L${x0 + 9} ${y - h} Z M${x0 + 3} ${y + h} L${x0 - 3} ${y + h + 8} L${x0} ${y + h + 8} L${x0 + 9} ${y + h} Z" fill="url(#${md})" stroke="${K}" stroke-width="0.9"/>
        <ellipse cx="${x0 - 3.5}" cy="${y}" rx="2" ry="${h + 1}" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/>
        <path d="M${x0 - 3.5} ${y - h - 1} V${y + h + 1}" stroke="#c9d3dc" stroke-width="1.2"/>
        <path d="M${x0} ${y - h * 0.8} Q${x0 - 1} ${y} ${x0} ${y + h * 0.8} L${x0 + 2} ${y + h} H${x1} V${y - h} H${x0 + 2} Z" fill="url(#${m})" stroke="${K}" stroke-width="1"/>
        <path d="M${x1} ${y - h} Q${x1 + n} ${y - h} ${x1 + n + 3} ${y} Q${x1 + n} ${y + h} ${x1} ${y + h} Z" fill="${tip}" stroke="${K}" stroke-width="1"/>
        <path d="M${x1 + 1} ${y - h + 1.5} Q${x1 + n * 0.7} ${y - h + 1.5} ${x1 + n} ${y - 2}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.2"/>
        <rect x="${x1 - 5}" y="${y - h}" width="3" height="${h * 2}" fill="url(#${cg})"/>
        <path d="M${x0 + 12} ${y - h} V${y + h} M${x0 + 22} ${y - h} V${y + h}" stroke="${K}" stroke-opacity="0.35" stroke-width="0.7"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${x0 + 5 + i * 5.5}" cy="${y + h * 0.55}" r="0.55" fill="${K}" opacity="0.5"/>`).join('')}
        ${hl(x0 + 3, y - h + 1.6, x1 - x0 - 6)}${opts.extra || ''}`;
    };
    let body;
    switch (kind) {
      case 'shell': body = turret() + barrel(27, 33.5, 27, 6) + `<path d="M55 36.5 L62 33 L60 36.5 L62 40 Z" fill="url(#${br})" stroke="${K}" stroke-width="0.8"/><path d="M57 34 l-3 -2 M57 39 l-3 2" stroke="${K}" stroke-width="0.8"/>`; break;
      case 'bullet': body = turret() + [31.5, 36, 40.5].map(y => barrel(27, y, 28, 3.6, false)).join('') +
        `<rect x="35" y="30" width="4" height="15" rx="1" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/><rect x="52" y="30" width="4" height="15" rx="1" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/>`; break;
      case 'twin': body = turret() + barrel(27, 31, 28, 4.6) + barrel(27, 38, 28, 4.6) + `<rect x="40" y="30" width="4" height="14" rx="1" fill="url(#${br})" stroke="${K}" stroke-width="0.8"/>`; break;
      case 'pellet': body = turret() + `<path d="M27 33 L50 28 Q53 28 53 31 V43 Q53 46 50 46 L27 41 Z" fill="url(#${m})" stroke="${K}" stroke-width="1.1"/>${hl(29, 31.5, 20)}
        <rect x="51" y="27" width="5" height="20" rx="1.5" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/>${[30, 34, 38, 42].map(y => `<circle cx="59" cy="${y}" r="1.8" fill="url(#${br})" stroke="${K}" stroke-width="0.5"/>`).join('')}`; break;
      case 'sonic': body = turret() + barrel(27, 34, 12, 5, false) + `<path d="M38 31 L50 24 V50 L38 43 Z" fill="url(#${m})" stroke="${K}" stroke-width="1.1"/><ellipse cx="50" cy="37" rx="2.5" ry="13" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/>
        <path d="M54 28 q5 9 0 18 M58 24 q8 13 0 26" fill="none" stroke="url(#${cg})" stroke-width="2.6" stroke-linecap="round"/>`; break;
      case 'mortar': body = turret() + `<g transform="rotate(-40 22 38)"><rect x="20" y="33" width="26" height="10" rx="2" fill="url(#${m})" stroke="${K}" stroke-width="1.1"/>${hl(22, 34.5, 20)}<rect x="43" y="31.5" width="5" height="13" rx="1.2" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/></g>
        <circle cx="50" cy="12" r="6.5" fill="url(#${md})" stroke="${K}" stroke-width="1"/><ellipse cx="48" cy="10" rx="2.4" ry="1.4" fill="#fff" opacity="0.5"/><rect x="48.5" y="3.5" width="3" height="3" fill="url(#${br})"/><path d="M50 3 l2 -2.5" stroke="#ffb03b" stroke-width="1.6" stroke-linecap="round"/>`; break;
      case 'acid': body = turret() + barrel(27, 34, 26, 5.5) + `<rect x="31" y="20" width="14" height="13" rx="3" fill="#cfeaff" fill-opacity="0.35" stroke="${K}" stroke-width="1"/><rect x="32" y="25" width="12" height="7" rx="2" fill="#7dff4d"/>
        <circle cx="36" cy="27" r="1" fill="#eaffd9"/><circle cx="40" cy="29" r="0.8" fill="#eaffd9"/><rect x="36" y="31" width="4" height="3.5" fill="url(#${md})"/>
        <path d="M56 41 q2.2 3.4 0 5.6 q-2.2 -2.2 0 -5.6z M60 44 q1.6 2.4 0 4 q-1.6 -1.6 0 -4z" fill="#9dff5d" stroke="#2a6a10" stroke-width="0.4"/><circle cx="55" cy="36.5" r="6" fill="url(#${gl})"/>`; break;
      case 'cryo': body = turret() + barrel(27, 34, 24, 6) + [31, 35, 39, 43].map(x => `<rect x="${x}" y="32.4" width="1.8" height="9.2" rx="0.8" fill="#bff3ff" stroke="${K}" stroke-width="0.4"/>`).join('') +
        `<circle cx="56" cy="37" r="7" fill="url(#${gl})"/><path d="M56 31 V43 M50.8 34 L61.2 40 M50.8 40 L61.2 34" stroke="#effcff" stroke-width="1.6" stroke-linecap="round"/>`; break;
      case 'ion': body = turret() + barrel(27, 34, 26, 6) + [32, 38, 44].map(x => `<rect x="${x}" y="30.5" width="3.4" height="13" rx="1.6" fill="url(#${cg})" stroke="${K}" stroke-width="0.7"/>`).join('') +
        `<circle cx="57" cy="37" r="7" fill="url(#${gl})"/><circle cx="57" cy="37" r="2.8" fill="#f0ecff" stroke="${c}" stroke-width="0.8"/>`; break;
      case 'vortex': body = turret() + barrel(27, 34, 10, 6, false) + `<path d="M36 32 L48 25 V49 L36 42 Z" fill="url(#${m})" stroke="${K}" stroke-width="1.1"/><ellipse cx="48" cy="37" rx="2.6" ry="12" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/>
        <path d="M58 37 m-6.5 0 a6.5 6.5 0 1 1 6.5 6.5 a4.2 4.2 0 1 1 -4.2 -4.2 a1.8 1.8 0 1 1 1.8 1.8" fill="none" stroke="url(#${cg})" stroke-width="2.4" stroke-linecap="round"/>`; break;
      case 'rail': body = turret() + `<rect x="25" y="30" width="36" height="3.6" rx="1" fill="url(#${m})" stroke="${K}" stroke-width="0.9"/><rect x="25" y="40.4" width="36" height="3.6" rx="1" fill="url(#${m})" stroke="${K}" stroke-width="0.9"/>
        <rect x="27" y="34" width="32" height="6" fill="url(#${cg})" opacity="0.85"/><path d="M28 37 H58" stroke="#fff" stroke-width="1" opacity="0.9"/>
        ${[33, 41, 49].map(x => `<rect x="${x}" y="28" width="3" height="18" rx="1" fill="url(#${md})" stroke="${K}" stroke-width="0.6"/>`).join('')}<circle cx="61" cy="37" r="5" fill="url(#${gl})"/>`; break;
      case 'plasma': body = turret() + barrel(27, 34, 10, 6, false) + `<ellipse cx="44" cy="37" rx="9" ry="8" fill="url(#${m})" stroke="${K}" stroke-width="1.1"/><ellipse cx="44" cy="37" rx="5.5" ry="4.8" fill="url(#${gl})"/><circle cx="44" cy="37" r="2.6" fill="#eaffd9"/>
        <rect x="52" y="34.5" width="6" height="5" rx="1.5" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/><circle cx="60" cy="37" r="4.5" fill="url(#${gl})"/>`; break;
      case 'tesla': body = turret() + barrel(27, 35, 8, 4, false) + `<rect x="34" y="27" width="10" height="20" rx="2" fill="url(#${md})" stroke="${K}" stroke-width="0.9"/>
        ${[29, 32, 35, 38, 41, 44].map(y => `<rect x="33" y="${y}" width="12" height="2" rx="1" fill="url(#${cu})"/>`).join('')}
        <rect x="44" y="35.5" width="5" height="3" fill="url(#${md})"/><circle cx="53" cy="37" r="5" fill="url(#${m})" stroke="${K}" stroke-width="0.9"/><circle cx="53" cy="37" r="9" fill="url(#${gl})"/>
        <path d="M57 33 l3 -5 l-0.5 4 l4 -1.5 l-4.5 7 l0.5 -3.5z" fill="#f2fdff" stroke="${c}" stroke-width="0.6"/>`; break;
      case 'torp': body = torpedo('#d9372b'); break;
      case 'torp_fast': body = torpedo('#ffd34d', { extra: `<path d="M3 24 h6 M1 32 h5 M3 40 h6" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>` }); break;
      case 'torp_homing': body = torpedo('#ff6b3d', { extra: `<circle cx="55" cy="32" r="2.6" fill="#ff2a2a" stroke="${K}" stroke-width="0.6"/><circle cx="54.3" cy="31.3" r="0.8" fill="#fff"/><path d="M30 25 V18 M27 18 h6" stroke="${K}" stroke-width="1"/>` }); break;
      case 'torp_net': body = torpedo('#3fd26b', { extra: `<g stroke="#1f5a2a" stroke-width="0.7" opacity="0.85">${[18, 24, 30, 36].map(x => `<path d="M${x} 25 l6 14 M${x + 6} 25 l-6 14"/>`).join('')}</g>` }); break;
      case 'torp_cluster': body = torpedo('#b46cff', { extra: `${[24, 30, 36].map(x => `<rect x="${x}" y="25" width="1.6" height="14" fill="${K}"/>`).join('')}<circle cx="60" cy="22" r="2.2" fill="url(#${cg})"/><circle cx="62" cy="30" r="2.2" fill="url(#${cg})"/><circle cx="62" cy="38" r="2.2" fill="url(#${cg})"/>` }); break;
      case 'torp_heavy': body = torpedo('#c92a20', { h: 10, x0: 9, x1: 44, nose: 13, extra: `<rect x="34" y="22" width="3" height="20" fill="url(#${cg})"/>` }); break;
      case 'torp_ghost': body = `<g opacity="0.55">${torpedo('#c9a8ff')}</g><rect x="4" y="22" width="56" height="20" rx="10" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 2.5"/>`; break;
      case 'torp_emp': body = torpedo('#3dfcff', { extra: `<path d="M28 21 l-4 9 h5 l-3 9" fill="none" stroke="#ffe680" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="56" cy="32" r="8" fill="url(#${gl})"/>` }); break;
      case 'torp_swarm': body = [16, 32, 48].map(y => torpedo('#ff8a3d', { y, h: 4.2, x0: 14, x1: 44, nose: 7 })).join(''); break;
      case 'torp_shkval': body = `<ellipse cx="34" cy="32" rx="29" ry="11" fill="#e8fbff" opacity="0.28" stroke="#bfefff" stroke-width="1"/>
        <circle cx="12" cy="26" r="1.6" fill="none" stroke="#dff8ff" stroke-width="0.8"/><circle cx="8" cy="37" r="2.2" fill="none" stroke="#dff8ff" stroke-width="0.8"/>` +
        torpedo('#ffd34d', { h: 5, x0: 12, x1: 50, nose: 9 }); break;
      case 'depth': body = `<rect x="19" y="14" width="26" height="38" rx="5" fill="url(#${m})" stroke="${K}" stroke-width="1.2"/>
        <rect x="17" y="12" width="30" height="5" rx="2" fill="url(#${md})" stroke="${K}" stroke-width="0.9"/><rect x="17" y="49" width="30" height="5" rx="2" fill="url(#${md})" stroke="${K}" stroke-width="0.9"/>
        <rect x="19" y="21" width="26" height="5" fill="#f2c230"/><rect x="19" y="40" width="26" height="5" fill="#f2c230"/>
        ${[21, 27, 33, 39].map(x => `<path d="M${x} 21 l3 5 M${x + 1} 40 l3 5" stroke="${K}" stroke-width="1.6"/>`).join('')}
        ${hl(22, 28, 3)}<rect x="22" y="27" width="2" height="12" rx="1" fill="#fff" opacity="0.45"/><rect x="28" y="7" width="8" height="5" rx="1.5" fill="url(#${md})" stroke="${K}" stroke-width="0.8"/>
        <circle cx="32" cy="33" r="3" fill="#ff3030" stroke="${K}" stroke-width="0.6"/><circle cx="32" cy="33" r="6" fill="url(#${gl})" opacity="0.6"/>
        <path d="M32 56 v5 M26 57 v3 M38 57 v3" stroke="#bfefff" stroke-width="1.5" stroke-linecap="round"/>`; break;
      case 'mine': body = `${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<g transform="rotate(${a} 32 31)"><rect x="30.3" y="11" width="3.4" height="8" fill="url(#${m})" stroke="${K}" stroke-width="0.6"/><circle cx="32" cy="11" r="2.4" fill="url(#${br})" stroke="${K}" stroke-width="0.5"/></g>`).join('')}
        <circle cx="32" cy="31" r="14" fill="url(#${m})" stroke="${K}" stroke-width="1.2"/><rect x="18" y="29.3" width="28" height="3.4" fill="url(#${md})"/>
        ${[21, 25, 29, 33, 37, 41].map(x => `<circle cx="${x + 0.5}" cy="31" r="0.7" fill="#dfe7ee"/>`).join('')}
        <ellipse cx="26" cy="24" rx="4" ry="2.2" fill="#fff" opacity="0.55" transform="rotate(-35 26 24)"/>
        <circle cx="32" cy="38" r="2.6" fill="#ff3030" stroke="${K}" stroke-width="0.5"/><circle cx="32" cy="38" r="6" fill="url(#${gl})" opacity="0.5"/>
        <path d="M32 45 v3" stroke="${K}" stroke-width="1"/>${[0, 1, 2].map(i => `<ellipse cx="32" cy="${50 + i * 4.5}" rx="1.6" ry="2.2" fill="none" stroke="#8796a5" stroke-width="1.2"/>`).join('')}`; break;
      default: body = `<circle cx="32" cy="32" r="12" fill="${c}"/>`;
    }
    return S('0 0 64 64', defs + `<circle cx="32" cy="32" r="30" fill="url(#${gl})" opacity="0.3"/>` + body);
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
