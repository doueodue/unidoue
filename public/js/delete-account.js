const $=s=>document.querySelector(s);
const call=async(m,u,b)=>{const r=await fetch(u,{method:m,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw new Error(j.error||'Xatolik yuz berdi');return j};
$('#f').onsubmit=async ev=>{ev.preventDefault();const m=$('#m'),b=$('#b'),em=$('#e').value.trim().toLowerCase(),pw=$('#p').value;m.className='';
 if(!em||!pw){m.className='e';m.textContent='Email va parolni kiriting.';return}
 if(!$('#ok').checked){m.className='e';m.textContent='Tasdiqlash belgisini qoʻying.';return}
 b.disabled=true;m.textContent='Kuting…';
 try{await call('POST','/api/login',{email:em,password:pw});await call('DELETE','/api/account',{password:pw});
  try{Object.keys(localStorage).filter(k=>k.indexOf('qabul:')===0).forEach(k=>localStorage.removeItem(k))}catch(e){}
  m.className='ok';m.textContent='Hisobingiz va barcha maʼlumotlaringiz oʻchirildi.';$('#f').querySelectorAll('input,button').forEach(x=>x.disabled=true)}
 catch(x){m.className='e';m.textContent=x.message;b.disabled=false}};
