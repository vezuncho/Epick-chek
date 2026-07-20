function setBottomNavActive(id){document.querySelectorAll('.epi-bottom-btn').forEach(b=>b.classList.remove('is-active'));const el=document.getElementById(id);if(el)el.classList.add('is-active');}
function cerrarInspeccionBottomNav(){
    const overlay=document.getElementById('modal-inspeccion-rapida-overlay');
    if(overlay)overlay.remove();
    if(window.inspeccionRapida&&window.inspeccionRapida.activa){
        window.inspeccionRapida.activa=false;
        if(typeof guardarEnLocalStorage==='function')guardarEnLocalStorage();
    }
}
function cerrarPanelesBottomNav(){['modal-calendario-overlay','modal-dashboard-overlay'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});cerrarInspeccionBottomNav();}
function bottomNavInicio(){setBottomNavActive('bn-home');cerrarPanelesBottomNav();if(typeof irInicio==='function')irInicio();else window.scrollTo({top:0,behavior:'smooth'});}
function bottomNavCalendario(){setBottomNavActive('bn-calendar');cerrarPanelesBottomNav();if(typeof abrirCalendarioRevisiones==='function')abrirCalendarioRevisiones();}
function bottomNavDashboard(){setBottomNavActive('bn-dashboard');cerrarPanelesBottomNav();if(typeof abrirDashboard==='function')abrirDashboard();}
function bottomNavInspeccion(){setBottomNavActive('bn-inspection');cerrarPanelesBottomNav();if(typeof abrirInspeccionRapida==='function')abrirInspeccionRapida();}
function bottomNavMenu(){setBottomNavActive('bn-menu');cerrarPanelesBottomNav();if(typeof toggleSidebar==='function')toggleSidebar(true);}
(function(){function syncAreaUI(pestana){const labels={personal:'EPIs',furgoneta:'Furgoneta',grua:'Grúa',herramienta:'Herram.'};['personal','furgoneta','grua','herramienta'].forEach(s=>{const b=document.getElementById('tab-'+s);if(!b)return;const active=s===pestana;b.className=active?'area-tab active-area py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-emerald-400 bg-slate-800 shadow-sm border border-emerald-700/50':'area-tab py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-slate-400 bg-slate-950 border border-slate-700 hover:text-slate-200';});const lab=document.getElementById('area-active-label');if(lab)lab.textContent=labels[pestana]||'Área';}
const oldCambiar=window.cambiarPestana;if(typeof oldCambiar==='function'&&!oldCambiar.__navReorgWrapped){const wrapped=function(pestana){const r=oldCambiar.apply(this,arguments);syncAreaUI(pestana);setBottomNavActive('bn-home');return r;};wrapped.__navReorgWrapped=true;window.cambiarPestana=wrapped;}window.addEventListener('load',()=>{try{syncAreaUI(window.pestanaActual||'personal');}catch(e){}});})();

/* Garantiza que la barra siga siendo hija directa de body y visible aunque una vista cambie el DOM. */
(function mantenerBarraInferiorPersistente(){
    function asegurar(){
        const nav=document.getElementById('epi-bottom-nav');
        if(!nav)return;
        if(nav.parentElement!==document.body)document.body.appendChild(nav);
        nav.hidden=false;
        nav.removeAttribute('aria-hidden');
        nav.style.setProperty('display','flex','important');
        nav.style.setProperty('visibility','visible','important');
        nav.style.setProperty('opacity','1','important');
        nav.style.setProperty('transform','none','important');
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',asegurar,{once:true});else asegurar();
    window.addEventListener('load',asegurar,{once:true});
    const observer=new MutationObserver(asegurar);
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});
    document.addEventListener('click',()=>requestAnimationFrame(asegurar),true);
})();
