/* ═══════════════════════════════════════════════
   IronQx Clinical & Performance Coaching
   WebAuthn biometric auth
   AUTO-EXTRACTED — runs as classic <script src>
═══════════════════════════════════════════════ */

const BIO_RP={name:"IronQx",id:window.location.hostname||"localhost"};
async function bioAvailable(){
  if(!window.PublicKeyCredential)return false;
  try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}
  catch(e){return false;}
}
function b64url(buf){
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}
function fromB64url(s){
  s=s.replace(/-/g,"+").replace(/_/g,"/");
  while(s.length%4)s+="=";
  return Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
}
async function bioRegister(pid){
  if(!await bioAvailable())return false;
  try{
    const challenge=crypto.getRandomValues(new Uint8Array(32));
    const uid=new TextEncoder().encode(pid);
    const cred=await navigator.credentials.create({publicKey:{
      challenge,rp:BIO_RP,
      user:{id:uid,name:"iqx_"+pid,displayName:"IronQx Paciente"},
      pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
      authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required"},
      timeout:60000,attestation:"none"
    }});
    if(!cred)return false;
    STORAGE.set("iq_bio_"+pid,JSON.stringify({
      id:b64url(cred.rawId),
      type:cred.type
    }));
    return true;
  }catch(e){return false;}
}
async function bioVerify(pid){
  const saved=STORAGE.get("iq_bio_"+pid);
  if(!saved)return false;
  try{
    const info=JSON.parse(saved);
    const challenge=crypto.getRandomValues(new Uint8Array(32));
    const cred=await navigator.credentials.get({publicKey:{
      challenge,
      allowCredentials:[{id:fromB64url(info.id),type:"public-key"}],
      userVerification:"required",timeout:60000
    }});
    return !!cred;
  }catch(e){return false;}
}
async function bioAuth(){
  if(PIN_MODE==="verify"){
    const ok=await bioVerify(S.pid);
    if(ok){
      // FIX Bug20: resetear contador de intentos PIN al entrar con biometría
      if(typeof _pinFailCount!=="undefined"){_pinFailCount=0;_pinLockUntil=0;}
      haptic("medium");saveSession({role:"patient",pid:S.pid,ts:Date.now()});
      G("pin-screen").classList.remove("open");loadPatient(S.pid);
    }
    else{toast("❌","Biometría no verificada — usa tu PIN");}
  }
}
async function initBioBtn(){
  const btn=G("bio-btn");if(!btn)return;
  const pid=S.pid;
  const hasBio=STORAGE.get("iq_bio_"+pid);
  const avail=await bioAvailable();
  if(avail&&hasBio&&PIN_MODE==="verify"){btn.style.display="flex";}
  else{btn.style.display="none";}
}
// Called after onboarding + pin setup: offer biometric registration
async function offerBioReg(pid){
  if(!await bioAvailable())return;
  if(STORAGE.get("iq_bio_"+pid))return; // already registered
  // Show toast offer after 2s
  setTimeout(()=>{
    const t=document.createElement("div");
    t.style.cssText="position:fixed;bottom:calc(90px + var(--safe-b));left:12px;right:12px;z-index:600;background:rgba(14,18,26,.98);border:1px solid rgba(85,119,238,.3);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);animation:fu .35s ease both";
    t.innerHTML=`<div style="width:38px;height:38px;border-radius:11px;background:rgba(85,119,238,.15);border:1px solid rgba(85,119,238,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--blue)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04.054-.09A13.916 13.916 0 0 0 8 11a4 4 0 1 1 8 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0 0 15.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 0 0 8 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg></div><div style="flex:1"><div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--txt)">Activar Face ID / Huella</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Entra más rápido en tu próxima visita</div></div><div style="display:flex;gap:6px;flex-shrink:0"><button onclick="this.closest('div[style]').remove()" style="background:none;border:1px solid var(--line);border-radius:8px;padding:5px 8px;font-size:10px;color:var(--muted);cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:1px">Ahora no</button><button id="bio-reg-btn" style="background:rgba(85,119,238,.15);border:1px solid rgba(85,119,238,.3);border-radius:8px;padding:5px 10px;font-size:10px;color:var(--blue);cursor:pointer;font-family:'Inter',sans-serif;font-weight:700;letter-spacing:1px">Activar</button></div>`;
    document.body.appendChild(t);
    t.querySelector("#bio-reg-btn").onclick=async()=>{
      const ok=await bioRegister(pid);
      t.remove();
      if(ok)toast("✅","Face ID / Huella activado para tu cuenta");
      else toast("⚠️","No se pudo activar — intenta desde Safari o Edge");
    };
    setTimeout(()=>{if(t.parentNode)t.remove();},12000);
  },2000);
}

