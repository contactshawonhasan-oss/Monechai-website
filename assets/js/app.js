/* Monechai.com - Store logic: cart, wishlist, search, checkout, COD */
const WA_NUMBER = '8801618108591'; // 01618108591
const HOTLINE = '01618-108591';
const TK = n => '৳' + Number(n).toLocaleString('en-IN');
function readStore(key, fallback){
  const current = localStorage.getItem(key);
  if(current !== null) return current;
  const legacyKey = key.replace('monechai_', ['mone','chi'].join('')+'_');
  const legacy = localStorage.getItem(legacyKey);
  if(legacy !== null){ localStorage.setItem(key, legacy); localStorage.removeItem(legacyKey); }
  return legacy ?? fallback;
}
let cart = JSON.parse(readStore('monechai_cart','[]'));
let wish = JSON.parse(readStore('monechai_wish','[]'));

function save(){ localStorage.setItem('monechai_cart',JSON.stringify(cart)); localStorage.setItem('monechai_wish',JSON.stringify(wish)); updateBadges(); renderCart(); }
function findP(id){ return PRODUCTS.find(p=>p.id===id); }
function updateBadges(){
  const cq = cart.reduce((s,c)=>s+c.qty,0);
  document.querySelectorAll('#cartCount,#cartCountM,#cartCount2').forEach(e=>{ if(e) e.textContent=cq; });
  document.querySelectorAll('#wishCount').forEach(e=>{ if(e) e.textContent=wish.length; });
}
function toast(msg){
  let t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200);
}
function addToCart(id,qty=1,openDrawer=true){
  const it=cart.find(c=>c.id===id);
  if(it) it.qty+=qty; else cart.push({id,qty});
  save(); toast(typeof t==='function' ? (getLang()==='bn'?'✅ কার্টে যোগ হয়েছে!':'✅ Added to cart!') : '✅ Added to cart!');
  if(openDrawer) openCart();
}
function buyNow(id){
  addToCart(id,1,false);
  location.href='checkout.html';
}
function toggleWish(id){
  if(wish.includes(id)) wish=wish.filter(w=>w!==id);
  else wish.push(id);
  save(); document.querySelectorAll(`[data-wish="${id}"]`).forEach(b=>b.classList.toggle('active',wish.includes(id)));
  toast(wish.includes(id)?'❤️ Added to wishlist':'Removed from wishlist');
}
function changeQty(id,d){
  const it=cart.find(c=>c.id===id); if(!it) return;
  it.qty+=d; if(it.qty<=0) cart=cart.filter(c=>c.id!==id);
  save();
}
function removeItem(id){ cart=cart.filter(c=>c.id!==id); save(); }

function productCard(p){
  const off = p.old> p.price ? Math.round((1-p.price/p.old)*100) : 0;
  const addT = typeof t==='function'?t('add'):'🛒 Add';
  const buyT = typeof t==='function'?t('buy'):'⚡ Order Now';
  const soldT = typeof t==='function'?t('sold'):'sold';
  return `<div class="pcard">
    <div class="pimg" onclick="quickView('${p.id}')" style="cursor:pointer">
      <img loading="lazy" src="${p.img}" alt="${p.name}">
      ${off?`<span class="off">-${off}%</span>`:''}
      <span class="badge2">${p.badge||''} • ${p.sold} ${soldT}</span>
      <button class="wish ${wish.includes(p.id)?'active':''}" data-wish="${p.id}" onclick="event.stopPropagation();toggleWish('${p.id}')">♥</button>
    </div>
    <div class="pbody">
      <div class="pname" onclick="quickView('${p.id}')" style="cursor:pointer">${p.name}</div>
      <div class="prate"><span class="stars">★★★★★</span> ${p.rating} (${p.sold})</div>
      <div class="pprice"><span class="now">${TK(p.price)}</span>${p.old>p.price?`<span class="old">${TK(p.old)}</span>`:''}</div>
      <div class="pbtns">
        <button class="add" onclick="addToCart('${p.id}')">${addT}</button>
        <button class="buy" onclick="buyNow('${p.id}')">${buyT}</button>
      </div>
    </div>
  </div>`;
}

function renderGrid(elId, list){
  const el=document.getElementById(elId); if(!el) return;
  el.innerHTML = list.length? list.map(productCard).join('') : '<p style="padding:20px;color:var(--text-secondary)">No products found. অন্য কিছু লিখে সার্চ করুন।</p>';
}
function renderCats(){
  const el=document.getElementById('catGrid'); if(!el) return;
  el.innerHTML = CATEGORIES.map(c=>`<div class="cat" onclick="goShop('${c.name}')"><img src="${c.img}" alt="${c.name}"><span>${c.name}</span></div>`).join('');
}
function goShop(cat='All'){
  location.href='shop.html?cat='+encodeURIComponent(cat);
}

// Cart drawer
function openCart(){ document.getElementById('overlay')?.classList.add('show'); document.getElementById('drawer')?.classList.add('open'); }
function closeCart(){ document.getElementById('overlay')?.classList.remove('show'); document.getElementById('drawer')?.classList.remove('open'); }
function renderCart(){
  const box=document.getElementById('cartItems'); if(!box) return;
  if(!cart.length){ box.innerHTML='<div style="text-align:center;padding:30px 10px;color:var(--text-secondary)"><div style="font-size:48px">🛒</div><b>Your cart is empty</b><br><small>কার্ট খালি। পছন্দের পণ্য যোগ করুন।</small><br><br><button class="btn btn-gold" onclick="closeCart();location.href=\'shop.html\'">Shop Now</button></div>'; }
  else{
    box.innerHTML=cart.map(c=>{
      const p=findP(c.id); if(!p) return '';
      return `<div class="citem"><img src="${p.img}"><div class="t"><strong>${p.name}</strong><div style="color:var(--focus);font-weight:900;margin-top:4px">${TK(p.price)} × ${c.qty} = ${TK(p.price*c.qty)}</div><div class="qty"><button onclick="changeQty('${p.id}',-1)">-</button><b>${c.qty}</b><button onclick="changeQty('${p.id}',1)">+</button><button onclick="removeItem('${p.id}')" style="margin-left:auto;border-color:var(--border);color:var(--red)">🗑</button></div></div></div>`;
    }).join('');
  }
  const sub=cart.reduce((s,c)=>{const p=findP(c.id);return s+(p?p.price*c.qty:0)},0);
  const ship = sub===0?0:(sub>=2000?0:60);
  const total=sub+ship;
  const st=document.getElementById('subTotal'); if(st) st.textContent=TK(sub);
  const sh=document.getElementById('shipCost'); if(sh) sh.textContent=sub>=2000&&sub>0?'FREE':TK(ship);
  const gt=document.getElementById('grandTotal'); if(gt) gt.textContent=TK(total);
  const fb=document.getElementById('freeBar'); if(fb){ const bn = typeof getLang==='function'&&getLang()==='bn'; if(sub>=2000) fb.innerHTML= bn?'🎉 ফ্রি ডেলিভারি পেয়েছেন!':'🎉 You got FREE delivery! ফ্রি ডেলিভারি!'; else if(sub>0) fb.innerHTML= bn?`আরও ${TK(2000-sub)} কিনলে <b>ফ্রি ডেলিভারি!</b>`:`Add ${TK(2000-sub)} more for FREE delivery!`; else fb.innerHTML= bn?'🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি':'🚚 Cash on Delivery all over Bangladesh'; }
  // checkout summary reuse
  const co=document.getElementById('coItems'); if(co){
    co.innerHTML = cart.map(c=>{const p=findP(c.id);return p?`<div style="display:flex;gap:10px;margin-bottom:10px;align-items:center"><img src="${p.img}" style="width:56px;height:56px;border-radius:10px;object-fit:cover"><div style="flex:1;font-size:13.5px"><b>${p.name.slice(0,45)}...</b><br>Qty: ${c.qty} × ${TK(p.price)}</div><b>${TK(p.price*c.qty)}</b></div>`:''}).join('')||'<p>Cart empty</p>';
    document.getElementById('coSub').textContent=TK(sub);
    document.getElementById('coShip').textContent=sub>=2000&&sub>0?'FREE':TK(ship);
    // delivery area override
    const area=document.getElementById('dArea'); let dc=ship;
    if(area){ dc = sub===0?0:(area.value==='outside'?120:(sub>=2000?0:60)); document.getElementById('coShip').textContent=sub>=2000&&area.value==='inside'?'FREE':TK(dc); }
    const g2=document.getElementById('coGrand'); if(g2) g2.textContent=TK(sub+dc);
  }
}

// Quick view modal
function quickView(id){
  const p=findP(id); if(!p) return;
  const off=p.old>p.price?Math.round((1-p.price/p.old)*100):0;
  document.getElementById('qvImg').src=p.img;
  document.getElementById('qvName').textContent=p.name;
  document.getElementById('qvMeta').innerHTML=`<span class="stars">★★★★★</span> ${p.rating} • <b>${p.sold} sold</b> • ${p.category} ${off?`• <span style="background:var(--red);color:var(--surface);padding:2px 8px;border-radius:99px;font-size:12px">-${off}% OFF</span>`:''}`;
  document.getElementById('qvPrice').innerHTML=`${TK(p.price)} ${p.old>p.price?`<s>${TK(p.old)}</s>`:''}`;
  document.getElementById('qvDesc').textContent=p.desc;
  document.getElementById('qvAdd').onclick=()=>addToCart(p.id,parseInt(document.getElementById('qvQty').value||1));
  document.getElementById('qvBuy').onclick=()=>buyNow(p.id);
  document.getElementById('qvModal').classList.add('show');
}
function closeQV(){ document.getElementById('qvModal')?.classList.remove('show'); }

// Search
function bindSearch(){
  const s=document.getElementById('searchInput');
  if(s){ s.addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    if(document.getElementById('allGrid')){
      const filtered=PRODUCTS.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q));
      renderGrid('allGrid',filtered);
    }
  });}
}

// Flash countdown (ends midnight)
function tick(){
  const el=document.getElementById('cd-h'); if(!el) return;
  const now=new Date(); const end=new Date(); end.setHours(23,59,59,999);
  let d=Math.max(0,Math.floor((end-now)/1000));
  const h=String(Math.floor(d/3600)).padStart(2,'0'), m=String(Math.floor(d%3600/60)).padStart(2,'0'), s=String(d%60).padStart(2,'0');
  el.textContent=h; document.getElementById('cd-m').textContent=m; document.getElementById('cd-s').textContent=s;
}
setInterval(tick,1000);

// Checkout submit
function submitOrder(e){
  e.preventDefault();
  if(!cart.length){ toast('Cart is empty!'); return false; }
  const name=document.getElementById('oName').value.trim();
  const phone=document.getElementById('oPhone').value.trim();
  const addr=document.getElementById('oAddr').value.trim();
  if(name.length<3){ toast('Please write your name'); return false; }
  if(!/^01[0-9]{9}$/.test(phone)){ toast('Please write correct 11-digit mobile (01XXXXXXXXX)'); return false; }
  if(addr.length<8){ toast('Please write full address'); return false; }
  const area=document.getElementById('dArea').value;
  const sub=cart.reduce((s,c)=>s+findP(c.id).price*c.qty,0);
  const ship=area==='outside'?120:(sub>=2000?0:60);
  const order={id:'MC'+Date.now().toString().slice(-6),name,phone,addr,area,items:[...cart],total:sub+ship,date:new Date().toLocaleString()};
  localStorage.setItem('monechai_last',JSON.stringify(order));
  cart=[]; save();
  location.href='order-success.html';
  return false;
}
function paySelect(el){
  document.querySelectorAll('.pay').forEach(p=>p.classList.remove('active')); el.classList.add('active');
  toast(el.dataset.pay+' selected');
}

// WhatsApp order
function waOrder(){
  if(!cart.length){ toast(typeof getLang==='function'&&getLang()==='bn'?'কার্ট খালি!':'Cart is empty!'); return; }
  const sub=cart.reduce((s,c)=>{const p=findP(c.id);return s+(p?p.price*c.qty:0)},0);
  const txt=`Assalamu Alaikum Monechai! I want to order:%0A`+cart.map(c=>{const p=findP(c.id);return `• ${p.name} x${c.qty} = ${p.price*c.qty}৳`}).join('%0A')+`%0ATotal: ${sub}৳`;
  window.open('https://wa.me/'+WA_NUMBER+'?text='+txt,'_blank');
}

// Re-render dynamic grids on language switch
function reRenderLang(){
  if(document.getElementById('flashGrid') && typeof PRODUCTS!=='undefined'){ try{ renderGrid('flashGrid', PRODUCTS.slice(0,5)); }catch(e){} }
  if(document.getElementById('allGrid') && typeof PRODUCTS!=='undefined'){ try{ const q=(document.getElementById('searchInput')?.value||'').toLowerCase(); const list=q?PRODUCTS.filter(p=>p.name.toLowerCase().includes(q)):PRODUCTS.slice(0,15); renderGrid('allGrid',list);}catch(e){} }
  if(document.getElementById('shopGrid') && typeof paint==='function'){ try{ paint(); }catch(e){} }
}

// Init shared chrome
document.addEventListener('DOMContentLoaded',()=>{
  updateBadges(); renderCart(); renderCats(); bindSearch(); tick();
  document.getElementById('overlay')?.addEventListener('click',closeCart);
});
