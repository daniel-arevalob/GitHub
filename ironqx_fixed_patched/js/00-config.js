/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   Config, Icons, Constants
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

const G=id=>document.getElementById(id);
const ADMIN={email:"dr@ironqx.com",pass:"ironqx2024"};
let S={role:null,pid:null,selPid:null,tab:"home"};
let PIN_BUF="",PIN_MODE="",PHOTO_TARGET=null,PHOTO_DATA={};
let REPLY_PID=null,REPLY_IDX=null;
const ICONS={
  bell:'<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0v4l1.8 2.8c.2.3 0 .7-.4.7H4.6c-.4 0-.6-.4-.4-.7L6 13.1V9"></path><path d="M10 19a2 2 0 0 0 4 0"></path></svg>',
  user:'<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"></path><path d="M5 19a7 7 0 0 1 14 0"></path></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>',
  'arrow-left':'<svg viewBox="0 0 24 24"><path d="M19 12H5"></path><path d="m11 18-6-6 6-6"></path></svg>',
  activity:'<svg viewBox="0 0 24 24"><path d="M3 12h4l2.5-5 4 10 2.5-5H21"></path></svg>',
  'check-circle':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m8.5 12 2.2 2.2 4.8-5"></path></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="m13 3-1.8 5.2L6 10l5.2 1.8L13 17l1.8-5.2L20 10l-5.2-1.8Z"></path></svg>',
  clipboard:'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="10" height="15" rx="2"></rect><path d="M9 5.5h6"></path><path d="M9 10h6M9 14h6"></path></svg>',
  chart:'<svg viewBox="0 0 24 24"><path d="M4 19h16"></path><path d="M7 15V9"></path><path d="M12 15V5"></path><path d="M17 15v-3"></path></svg>',
  note:'<svg viewBox="0 0 24 24"><path d="M7 4h10a2 2 0 0 1 2 2v12l-4-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"></path></svg>',
  target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 4v2M20 12h-2M12 20v-2M4 12h2"></path></svg>',
  expand:'<svg viewBox="0 0 24 24"><path d="M8 3H3v5"></path><path d="m3 3 6 6"></path><path d="M16 3h5v5"></path><path d="m21 3-6 6"></path><path d="M8 21H3v-5"></path><path d="m3 21 6-6"></path><path d="M16 21h5v-5"></path><path d="m21 21-6-6"></path></svg>',
  shrink:'<svg viewBox="0 0 24 24"><path d="M9 9H3V3"></path><path d="m3 9 7-7"></path><path d="M15 9h6V3"></path><path d="m21 9-7-7"></path><path d="M9 15H3v6"></path><path d="m3 15 7 7"></path><path d="M15 15h6v6"></path><path d="m21 15-7 7"></path></svg>',
  inbox:'<svg viewBox="0 0 24 24"><path d="M4 6h16l-1.5 11H5.5L4 6Z"></path><path d="M4 13h4l2 3h4l2-3h4"></path></svg>',
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 1 1 8 0v3"></path></svg>',
  phone:'<svg viewBox="0 0 24 24"><path d="M7 4h10"></path><rect x="6" y="3" width="12" height="18" rx="2"></rect><path d="M11 17h2"></path></svg>',
  calendar:'<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2"></rect><path d="M8 3v4M16 3v4M4 10h16"></path></svg>',
  settings:'<svg viewBox="0 0 24 24"><path d="M12 8.8A3.2 3.2 0 1 0 15.2 12 3.2 3.2 0 0 0 12 8.8Z"></path><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z"></path></svg>',
  users:'<svg viewBox="0 0 24 24"><path d="M9 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"></path><path d="M17 11a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17 11Z"></path><path d="M3.5 18a5.5 5.5 0 0 1 11 0"></path><path d="M14.5 18a4.5 4.5 0 0 1 6 0"></path></svg>',
  credit:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M3 10h18"></path><path d="M7 15h3"></path></svg>',
  stethoscope:'<svg viewBox="0 0 24 24"><path d="M8 4v5a4 4 0 0 0 8 0V4"></path><path d="M6 4h4M14 4h4"></path><path d="M12 13v2a4 4 0 0 0 8 0 2 2 0 1 0-2-2"></path></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16v4Z"></path><path d="m12 6 4 4"></path></svg>',
  document:'<svg viewBox="0 0 24 24"><path d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"></path><path d="M14 3v5h5"></path></svg>',
  upload:'<svg viewBox="0 0 24 24"><path d="M12 16V6"></path><path d="m8 10 4-4 4 4"></path><path d="M5 18h14"></path></svg>',
  home:'<svg viewBox="0 0 24 24"><path d="m4 11 8-6 8 6"></path><path d="M6 10.5V20h12v-9.5"></path></svg>',
  key:'<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="3"></circle><path d="M11 12h9"></path><path d="M17 12v3"></path><path d="M20 12v2"></path></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3.4 8.3 7 10 3.6-1.7 7-5 7-10V6l-7-3Z"></path></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 12h8l1-12"></path></svg>',
  alert:'<svg viewBox="0 0 24 24"><path d="M12 4 3 20h18L12 4Z"></path><path d="M12 9v5"></path><path d="M12 17h.01"></path></svg>',
  'x-circle':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6M15 9l-6 6"></path></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"></path></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v5"></path><path d="M12 7h.01"></path></svg>',
  weight:'<svg viewBox="0 0 24 24"><path d="M7 7h10l3 12H4L7 7Z"></path><path d="M12 7a2 2 0 1 0-2-2"></path><path d="M12 11v3"></path></svg>',
  camera:'<svg viewBox="0 0 24 24"><path d="M5 8h3l1.5-2h5L16 8h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"></path><circle cx="12" cy="13" r="3.2"></circle></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M5 5h14v10H9l-4 4V5Z"></path></svg>',
  hourglass:'<svg viewBox="0 0 24 24"><path d="M7 4h10"></path><path d="M7 20h10"></path><path d="M8 4c0 4 4 4 4 8s-4 4-4 8"></path><path d="M16 4c0 4-4 4-4 8s4 4 4 8"></path></svg>',
  traffic:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="18" rx="3"></rect><circle cx="12" cy="8" r="1.2"></circle><circle cx="12" cy="12" r="1.2"></circle><circle cx="12" cy="16" r="1.2"></circle></svg>',
  'delete-left':'<svg viewBox="0 0 24 24"><path d="M9 7H5l-3 5 3 5h10a3 3 0 0 0 0-10Z"></path><path d="m10 10 4 4M14 10l-4 4"></path></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.35-4.35"></path></svg>',
  'eye-off':'<svg viewBox="0 0 24 24"><path d="M17.9 17.9A9.9 9.9 0 0 1 12 20C5.5 20 2 12 2 12a17.8 17.8 0 0 1 4.1-5.9M9.9 4.2A9.7 9.7 0 0 1 12 4c6.5 0 10 8 10 8a17.8 17.8 0 0 1-2.1 3.1M3 3l18 18"></path><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"></path></svg>',
  more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"></circle><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"></circle><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"></circle></svg>',
  trophy:'<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4"></path><path d="M7 4H5a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h.5"></path><path d="M17 4h2a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4h-.5"></path><path d="M7.5 4h9a1 1 0 0 1 1 1v7a5.5 5.5 0 0 1-11 0V5a1 1 0 0 1 1-1Z"></path></svg>',
  send:'<svg viewBox="0 0 24 24"><path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4 20-7Z"></path></svg>'
};
const iconSvg=name=>ICONS[name]||ICONS.info;
const icon=(name,cls='')=>`<span class="iq-ic ${cls}" aria-hidden="true">${iconSvg(name)}</span>`;
const FAT_COLOR='#e85d75'; // color centralizado para gráficas de % grasa
function paintIcons(root=document){
  root.querySelectorAll('[data-ic]').forEach(el=>{
    el.classList.add('iq-ic');
    el.setAttribute('aria-hidden','true');
    el.innerHTML=iconSvg(el.dataset.ic);
  });
}
function toastIconName(ic){
  if(ic==='✅')return{name:'check-circle',tone:'green'};
  if(ic==='❌')return{name:'x-circle',tone:'red'};
  if(ic==='⚠️')return{name:'alert',tone:'amber'};
  if(ic==='🗑️')return{name:'trash',tone:'red'};
  return{name:'info',tone:'gold'};
}
