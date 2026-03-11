/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   STORAGE wrapper + DB object
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

const MEM_STORE={};
const LS_OK=(()=>{try{localStorage.setItem("_t","1");localStorage.removeItem("_t");return true;}catch{return false;}})();
const STORAGE={
  get(key){
    if(LS_OK){try{const v=localStorage.getItem(key);if(v!==null)return v;}catch{}}
    return Object.prototype.hasOwnProperty.call(MEM_STORE,key)?MEM_STORE[key]:null;
  },
  set(key,val){
    const value=String(val);
    MEM_STORE[key]=value; // always write to memory first
    if(LS_OK){try{localStorage.setItem(key,value)}catch{}}
  },
  remove(key){
    delete MEM_STORE[key];
    if(LS_OK){try{localStorage.removeItem(key)}catch{}}
  }
};

