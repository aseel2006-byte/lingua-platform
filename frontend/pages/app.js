
var DB=[];
var cLang='en',cLevel='B1',cSkill='all',cSort='pop';
var IMAP={listening:'ti-ear',speaking:'ti-messages',reading:'ti-book-2',writing:'ti-pencil',pdf:'ti-file-type-pdf',audio:'ti-player-play',bundle:'ti-package'};
var CMAP={en:'#534AB7',tr:'#0B5E46',zh:'#993C1D'};

function L(){return document.documentElement.getAttribute('data-lang')||'ar';}
function _(ar,en){return L()==='ar'?ar:en;}

function scrollTo(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth'});}

function toggleLang(){
  var h=document.documentElement;
  var next=h.getAttribute('data-lang')==='ar'?'en':'ar';
  h.setAttribute('data-lang',next);
  h.setAttribute('lang',next);
  h.setAttribute('dir',next==='ar'?'rtl':'ltr');
  var lb=document.getElementById('langBtn');
  if(lb)lb.textContent=next==='ar'?'EN':'AR';
  render();
}

function setHeroLang(lang,btn){
  document.querySelectorAll('.lang-opt').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  filterLang(lang);
}

function filterLang(lang){
  cLang=lang;
  document.querySelectorAll('.lfbtn').forEach(function(b){
    b.classList.remove('active');
    if(b.getAttribute('data-lang')===lang)b.classList.add('active');
  });
  updateFeat();render();
}

function filterLevel(lvl,btn){
  cLevel=lvl;
  document.querySelectorAll('.lvl-btn').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  render();
}

function filterSkill(sk,btn){
  cSkill=sk;
  document.querySelectorAll('.skill-btn').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  render();
}

function doSort(v){cSort=v;render();}

var FAR={en:'\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 A0-C2',tr:'\u0627\u0644\u062a\u0631\u0643\u064a\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 A0-C1',zh:'\u0627\u0644\u0635\u064a\u0646\u064a\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 A0-C1'};
var FEN={en:'Complete English A0-C2',tr:'Complete Turkish A0-C1',zh:'Complete Chinese A0-C1'};
var FPR={en:'399 SAR',tr:'349 SAR',zh:'369 SAR'};
var FDL={en:'799',tr:'650',zh:'700'};
var FPC={en:'50',tr:'46',zh:'47'};
var FID={en:'en-full',tr:'tr-full',zh:'zh-full'};

function updateFeat(){
  var e=document.getElementById('ft-ar');if(e)e.textContent=FAR[cLang]||'';
  var f=document.getElementById('ft-en');if(f)f.textContent=FEN[cLang]||'';
  var g=document.getElementById('fp');if(g)g.innerHTML=(FPR[cLang]||'')+' <del>'+(FDL[cLang]||'')+'</del>';
  var sa=document.querySelector('.save-tag.ar');
  var se=document.querySelector('.save-tag.en');
  if(sa)sa.textContent='\u0648\u0641\u0651\u0631 '+(FPC[cLang]||'')+'%';
  if(se)se.textContent='Save '+(FPC[cLang]||'')+'%';
}

var SAR={listening:'\u0627\u0633\u062a\u0645\u0627\u0639',speaking:'\u0645\u062d\u0627\u062f\u062b\u0629',reading:'\u0642\u0631\u0627\u0621\u0629',writing:'\u0643\u062a\u0627\u0628\u0629',pdf:'PDF',audio:'\u0635\u0648\u062a\u064a',bundle:'\u0628\u0627\u0642\u0629'};
var SEN={listening:'Listening',speaking:'Speaking',reading:'Reading',writing:'Writing',pdf:'PDF',audio:'Audio',bundle:'Bundle'};

function render(){
  if(!DB.length)return;
  var lang=L();
  var ce=document.getElementById('cnt-en');if(ce)ce.textContent=DB.filter(function(p){return p.l==='en';}).length;
  var ct=document.getElementById('cnt-tr');if(ct)ct.textContent=DB.filter(function(p){return p.l==='tr';}).length;
  var cz=document.getElementById('cnt-zh');if(cz)cz.textContent=DB.filter(function(p){return p.l==='zh';}).length;
  var prods=DB.filter(function(p){return p.l===cLang;});
  if(cLevel!=='all'){
    if(cLevel==='C2')prods=prods.filter(function(p){return p.lv==='C2';});
    else prods=prods.filter(function(p){return p.lv===cLevel||p.lv==='A0+';});
  }
  if(cSkill!=='all')prods=prods.filter(function(p){return p.s===cSkill;});
  if(cSort==='price-asc')prods.sort(function(a,b){return a.p-b.p;});
  else if(cSort==='price-desc')prods.sort(function(a,b){return b.p-a.p;});
  else if(cSort==='rating')prods.sort(function(a,b){return b.r-a.r;});
  else prods.sort(function(a,b){return b.c-a.c;});
  var pa=document.getElementById('pc-ar');if(pa)pa.textContent=prods.length;
  var pe=document.getElementById('pc-en');if(pe)pe.textContent=prods.length;
  var grid=document.getElementById('pgrid');if(!grid)return;
  var NF=lang==='ar'?'\u0644\u0627 \u062a\u0648\u062c\u062f \u062f\u0631\u0648\u0633':'No courses match this filter';
  if(!prods.length){
    grid.innerHTML='<div class="no-results"><i class="ti ti-search"></i><p>'+NF+'</p></div>';
    return;
  }
  var FREE=lang==='ar'?'\u0645\u062c\u0627\u0646\u064a':'Free';
  var ADD=lang==='ar'?'\u0623\u0636\u0641':'Add';
  var GET=lang==='ar'?'\u062d\u0645\u0651\u0644':'Get';
  var HOT=lang==='ar'?'\u0627\u0644\u0623\u0643\u062b\u0631 \u0645\u0628\u064a\u0639\u0627\u064b':'Best Seller';
  var NEW=lang==='ar'?'\u062c\u062f\u064a\u062f':'New';
  grid.innerHTML=prods.map(function(p){
    var ico=IMAP[p.s]||'ti-book-2',col=CMAP[p.l]||'#534AB7';
    var title=lang==='ar'?p.ar:p.en;
    var sk=lang==='ar'?(SAR[p.s]||p.s):(SEN[p.s]||p.s);
    var badge='';
    if(p.b==='hot')badge='<span class="pbadge badge-hot">\uD83D\uDD25 '+HOT+'</span>';
    else if(p.b==='new')badge='<span class="pbadge badge-new">\u2728 '+NEW+'</span>';
    else if(p.b==='free')badge='<span class="pbadge badge-free">\uD83C\uDD13 '+FREE+'</span>';
    var price=p.f?'<div class="pprice free">'+FREE+'</div>':'<div class="pprice">'+(p.o?'<del>'+p.o+'</del> ':'')+p.p+' <small style="font-size:10px;font-weight:400">SAR</small></div>';
    var btn=p.f
      ?'<button class="btn btn-jade btn-sm" onclick="event.stopPropagation();dlFree()"><i class="ti ti-download"></i>'+GET+'</button>'
      :'<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();addById(''+p.id+'')"><i class="ti ti-plus"></i>'+ADD+'</button>';
    return '<div class="pcard" onclick="openProduct(''+p.id+'')">'
      +'<div class="pthumb '+p.l+'"><i class="ti '+ico+'" style="color:'+col+'"></i>'+badge+'</div>'
      +'<div class="pbody"><div class="ptitle">'+title+'</div>'
      +'<div class="pmeta"><span style="font-family:sans-serif">'+p.lv+'</span>'
      +'<span class="mdot"></span><span>'+sk+'</span>'
      +'<span class="mdot"></span><span class="pstars"><i class="ti ti-star-filled"></i> '+p.r+'</span></div>'
      +'<div class="pfoot">'+price+btn+'</div></div></div>';
  }).join('');
}

function openProduct(id){location.href='product.html?id='+id;}
function addById(id){var p=DB.find(function(x){return x.id===id;});if(p)addProd(p);}
function dlFree(){showToast(_('\u062c\u0627\u0631\u064d...','Downloading...'));}

var CART={
  get:function(){return JSON.parse(localStorage.getItem('lingua_cart')||'[]');},
  save:function(c){localStorage.setItem('lingua_cart',JSON.stringify(c));},
  add:function(p){var c=CART.get();if(!c.find(function(i){return i.id===p.id;}))c.push(p);CART.save(c);updateCartUI();},
  remove:function(id){CART.save(CART.get().filter(function(i){return i.id!==id;}));updateCartUI();},
  total:function(){return CART.get().reduce(function(s,i){return s+Number(i.price||0);},0);}
};

function addProd(p){
  CART.add({id:p.id,title:_( p.ar, p.en),price:p.p||0,skill:p.s,lang:p.l});
  showToast(_('\u062a\u0645\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0644\u0644\u0633\u0644\u0629 \u2713','Added to cart \u2713'));
}

function updateCartUI(){
  var lang=L(),items=CART.get();
  var cnt=document.getElementById('cartCount');if(cnt)cnt.textContent=items.length;
  var body=document.getElementById('cartBody'),foot=document.getElementById('cartFoot');
  if(!body)return;
  var EMPTY=_('\u0633\u0644\u062a\u0643 \u0641\u0627\u0631\u063a\u0629','Your cart is empty');
  var FREE=_('\u0645\u062c\u0627\u0646\u064a','Free');
  if(!items.length){
    body.innerHTML='<div class="cempty"><i class="ti ti-shopping-cart"></i><span>'+EMPTY+'</span></div>';
    if(foot)foot.style.display='none';return;
  }
  var LMAP={en:'English',tr:'Turkish',zh:'Chinese'};
  body.innerHTML=items.map(function(item){
    return '<div class="ci">'
      +'<div class="ci-icon"><i class="ti '+(IMAP[item.skill]||'ti-book-2')+'"></i></div>'
      +'<div class="ci-info"><div class="ci-title">'+item.title+'</div>'
      +'<div class="ci-sub">'+(LMAP[item.lang]||item.lang)+'</div></div>'
      +'<div class="ci-price">'+(Number(item.price)===0?FREE:(item.price+' SAR'))+'</div>'
      +'<button class="ci-rm" onclick="CART.remove(''+item.id+'')"><i class="ti ti-trash"></i></button>'
      +'</div>';
  }).join('');
  var tot=document.getElementById('cartTotal');if(tot)tot.textContent=CART.total().toFixed(0)+' SAR';
  if(foot)foot.style.display='block';
}

function closeCart(){var co=document.getElementById('cartOverlay');if(co)co.classList.remove('open');}

var _tt;
function showToast(msg){
  var t=document.getElementById('toast'),m=document.getElementById('toastMsg');
  if(t&&m){m.textContent=msg;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){t.classList.remove('show');},2800);}
}

function toggleFaq(el){
  var item=el.closest('.faq-item');
  var isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(i){i.classList.remove('open');});
  if(!isOpen)item.classList.add('open');
}

function initNav(){
  var token=localStorage.getItem('lingua_token');
  var user=JSON.parse(localStorage.getItem('lingua_user')||'null');
  var li=document.getElementById('navLogin'),re=document.getElementById('navRegister');
  if(!li||!re)return;
  if(token&&user){
    li.innerHTML='<i class="ti ti-user-circle"></i> '+(user.name||'').split(' ')[0];
    li.onclick=function(){location.href='pages/dashboard.html';};
    re.innerHTML=user.role==='admin'?'<i class="ti ti-settings"></i> Admin':'<i class="ti ti-layout-dashboard"></i> '+(L()==='ar'?'\u0644\u0648\u062d\u062a\u064a':'Dashboard');
    re.onclick=function(){location.href=user.role==='admin'?'pages/admin.html':'pages/dashboard.html';};
  }else{
    li.onclick=function(){location.href='pages/auth.html';};
    re.onclick=function(){location.href='pages/auth.html?tab=register';};
  }
}

function initApp(){
  // \u062A\u062D\u0645\u064A\u0644 DB \u0645\u0646 window.LINGUA_DB (\u0645\u062D\u0645\u0651\u0644\u0629 \u0645\u0646 db.js inline)
  if(window.LINGUA_DB&&window.LINGUA_DB.length){
    DB=window.LINGUA_DB;
  } else {
    var g=document.getElementById('pgrid');
    if(g)g.innerHTML='<div class="no-results"><i class="ti ti-alert-circle"></i><p>Database error. Please refresh.</p></div>';
    return;
  }
  // \u0625\u0639\u062F\u0627\u062F \u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0644\u063A\u0629
  document.querySelectorAll('.lfbtn').forEach(function(b){
    var oc=b.getAttribute('onclick')||'';
    var m=oc.match(/filterLang\('([^']+)'/);
    if(m)b.setAttribute('data-lang',m[1]);
  });
  initNav();updateFeat();render();updateCartUI();
}

document.addEventListener('DOMContentLoaded',function(){
  var cb=document.getElementById('cartBtn'),co=document.getElementById('cartOverlay');
  if(cb)cb.addEventListener('click',function(){co.classList.toggle('open');updateCartUI();});
  if(co)co.addEventListener('click',function(e){if(e.target===co)closeCart();});
  var fb=document.getElementById('feat-btn');
  if(fb)fb.addEventListener('click',function(){
    var id=FID[cLang];
    var p=DB.find(function(x){return x.id===id;});
    if(p)addProd(p);
  });
  initApp();
});
