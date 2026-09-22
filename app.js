/* Defter — seri uygulaması */
(function(){
'use strict';
const S=window.SERI, DOC={}; S.docs.forEach(d=>DOC[d.id]=d);
const NO2ID={}; S.docs.forEach(d=>{ if(d.no>0) NO2ID[d.no]=d.id; });

/* ---------- yardımcılar ---------- */
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
const GUN=864e5;
function bugun(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function tarih(s){ const [y,m,g]=s.split('-').map(Number); return new Date(y,m-1,g); }
function ekle(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function fark(a,b){ return Math.round((b-a)/GUN); }
const AYLAR=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const kisa=d=>d.getDate()+' '+AYLAR[d.getMonth()];
const uzun=d=>d.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
const gunAdi=d=>d.toLocaleDateString('tr-TR',{weekday:'long'});
function pazartesi(d){ const x=new Date(d); const g=(x.getDay()+6)%7; x.setDate(x.getDate()-g); return x; }
function hash(s){ let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))|0; return Math.abs(h); }
const klon=o=>o==null?o:JSON.parse(JSON.stringify(o));
const dizi=x=>Array.isArray(x)?x:(x&&typeof x==='object'?Object.keys(x).filter(k=>/^\d+$/.test(k)).reduce((a,k)=>(a[+k]=x[k],a),[]):[]);
const temiz=o=>JSON.parse(JSON.stringify(o));
const bolum=(doc,no)=>`#/oku/${doc}/s-${String(no).replace('.','-')}`;
const docAd=id=>DOC[id]?DOC[id].baslik:id;

/* ---------- depo: kayıt başına son-yazan-kazanır ---------- */
const ANAHTAR='defter.v1';
const depo={r:{}};
function yukle(){ try{ const j=JSON.parse(localStorage.getItem(ANAHTAR)||'{}'); depo.r=j.r||{}; }catch(e){ depo.r={}; } }
function sakla(){ try{ localStorage.setItem(ANAHTAR,JSON.stringify({r:depo.r})); }catch(e){} }
function al(k,v){ const x=depo.r[k]; return x&&x.v!=null?x.v:v; }
function koy(k,v,o={}){ depo.r[k]={v,t:Date.now()}; sakla(); senkron.it(); sonrasi(o); }
function anahtarlar(p){ return Object.keys(depo.r).filter(k=>k.startsWith(p)&&depo.r[k].v!=null); }
function birlestir(uzak){ let d=false; for(const k in uzak){ const a=depo.r[k],b=uzak[k]; if(b&&(!a||b.t>a.t)){ depo.r[k]=b; d=true; } } if(d) sakla(); return d; }
function yolKoy(o,yol,v){ const p=yol.split('.'); let x=o; for(let i=0;i<p.length-1;i++){ if(typeof x[p[i]]!=='object'||x[p[i]]===null) x[p[i]]=/^\d+$/.test(p[i+1])?[]:{}; x=x[p[i]]; } x[p[p.length-1]]=v; }
function yolAl(o,yol){ return yol.split('.').reduce((x,k)=>x==null?undefined:x[k],o); }

/* ---------- programlar ---------- */
const PROG=[
 {id:'disiplin',ad:'Disiplin',kod:'Ds',no:1,gun:30,bas:1,gecis:5,ilk:'5.9',asgari:'5.6',olcum:'5.3',faz:1,
  gorev:'25 dakikalık blok ve 20 dakika kulaklıksız yürüyüş',zor:'15 dakikalık tek blok ve sabit yatma saati',metrik:{ad:'Yatma saatinde yattım',tip:'evet'},
  fazlar:[[1,30,'İlk 30 gün','5.9']]},
 {id:'dikkat',ad:'Dikkat',kod:'Dk',no:2,gun:42,bas:6,gecis:12,ilk:'5.6',asgari:'5.5',olcum:'5.1',faz:1,
  gorev:'Günün bloğu ve günlük boşluk',zor:'15 dakikalık tek blok, 5 dakika boşluk, telefon yatak odasında değil',metrik:{ad:'En uzun kesintisiz blok',tip:'sayi',birim:'dk'},ekler:[{ad:'Boşluk',birim:'dk',alan:'b'}],
  fazlar:[[1,14,'Faz 1: Ortam','5.2'],[15,28,'Faz 2: Kapasite','5.3'],[29,42,'Faz 3: Yerleşme','5.4']]},
 {id:'ogrenme',ad:'Öğrenme',kod:'Öğ',no:3,gun:30,bas:13,gecis:17,ilk:'5.5',asgari:'5.4',olcum:'5.2',faz:2,
  gorev:'Öğrendiğini akşam boş sayfaya yaz, bakmadan',zor:'5 dakikalık tek geri çağırma, yeni materyal yok',metrik:{ad:'Akşam geri çağırma',tip:'evet'},
  fazlar:[[1,7,'Hafta 1','5.2'],[8,14,'Hafta 2','5.2'],[15,21,'Hafta 3','5.2'],[22,30,'Hafta 4','5.2']]},
 {id:'duygu',ad:'Duygu',kod:'Du',no:4,gun:42,bas:18,gecis:24,ilk:'5.6',asgari:'5.5',olcum:'5.1',faz:2,
  gorev:'Tarama, adlandırma, akşam üç iyi madde',zor:'Öfke mesajı kuralı ve tek bir uzun nefes verme turu',metrik:{ad:'Mesafe koyabildiğim an',tip:'sayi'},
  fazlar:[[1,14,'Faz 1: Fark etme','5.2'],[15,28,'Faz 2: Çekirdek araçlar','5.3'],[29,42,'Faz 3: Yeniden değerlendirme','5.4']]},
 {id:'bitirme',ad:'Bitirme',kod:'Bt',no:8,gun:30,bas:25,gecis:29,ilk:'5.6',asgari:'5.5',olcum:'5.1',faz:3,
  gorev:'Seçtiğin projede günün küçük bitişi',zor:'Günün en küçük bitişi; yeni fikir listeye, kapsama değil',metrik:{ad:'Küçük bitiş',tip:'evet'},
  fazlar:[[1,7,'Seçim ve tanım','5.2'],[8,21,'Son yüzde on','5.3'],[22,30,'Yayın','5.4']]},
 {id:'iletisim',ad:'İletişim',kod:'İl',no:9,gun:30,bas:30,gecis:34,ilk:'5.6',asgari:'5.5',olcum:'5.1',faz:3,
  gorev:'Haftanın aracını bir konuşmada uygula',zor:'Tek özetleme döngüsü, telefon görüş alanı dışında',metrik:{ad:'Özetleme döngüsü',tip:'sayi'},ekler:[{ad:'Sözünü kestim',alan:'kes'},{ad:'Kesmek üzereyken durdum',alan:'dur'}],
  fazlar:[[1,7,'Fark etme','5.2'],[8,21,'Araçlar','5.3'],[22,30,'Zor konuşmalar','5.4']]},
 {id:'ustalasma',ad:'Ustalaşma',kod:'Us',no:13,gun:56,bas:35,gecis:43,ilk:'5.6',asgari:'5.5',olcum:'5.1',faz:4,
  gorev:'Seçtiğin becerinin sınırında çalışmak',zor:'Bu hafta sınırda bir saat, üretim kaydına bir satır',metrik:{ad:'Sınırda geçen süre',tip:'sayi',birim:'dk'},
  fazlar:[[1,14,'Harita ve seçim','5.2'],[15,35,'Sınırda','5.3'],[36,56,'Üretim ve geri bildirim','5.4']]},
 {id:'para',ad:'Para',kod:'Pr',no:14,gun:30,bas:44,gecis:48,ilk:'5.6',asgari:'5.5',olcum:'5.1',faz:4,
  gorev:'Günün harcamalarını kaydetmek',zor:'Birikim otomatiği açık kalsın, büyük harcamada bekle',metrik:{ad:'Harcama kaydı',tip:'evet'},
  fazlar:[[1,7,'Kayıt','5.2'],[8,21,'Otomasyon ve bekleme','5.3'],[22,30,'Yeterince ve tampon','5.4']]}
];
const PID={}; PROG.forEach(p=>PID[p.id]=p);
const Y=S.yonerge||{};
const PADI={Disiplin:'disiplin',Dikkat:'dikkat','Öğrenme':'ogrenme',Duygu:'duygu',Bitirme:'bitirme','İletişim':'iletisim','Ustalaşma':'ustalasma',Para:'para'};
const ilkBuyuk=s=>s.replace(/^(["“]?)(\p{L})/u,(_,q,c)=>q+c.toLocaleUpperCase('tr'));
const MADDELER=[]; S.artik.forEach(r=>{ const pid=PADI[r.program]; r.maddeler.forEach((m,i)=>MADDELER.push({id:pid+'-'+i,pid,doc:pid,ad:ilkBuyuk(m)})); });
(S.kavramPratik||[]).forEach(x=>MADDELER.push({id:'k-'+x.doc,pid:null,doc:x.doc,ad:ilkBuyuk(x.ad),kavram:true}));
const FAZLAR=[{no:1,ad:'Temel',a:1,b:12,p:['disiplin','dikkat']},{no:2,ad:'Zihin',a:13,b:24,p:['ogrenme','duygu']},{no:3,ad:'Üretim ve insanlar',a:25,b:34,p:['bitirme','iletisim']},{no:4,ad:'Derinlik ve kaynak',a:35,b:48,p:['ustalasma','para']}];
const fazOf=w=>FAZLAR.find(f=>w>=f.a&&w<=f.b);

/* ---------- ritimler ---------- */
const HAFTALIK=[
 {id:'dinlenme',ad:'Bir tam dinlenme günü',k:['disiplin','4.6'],bas:1},
 {id:'kalibrasyon',ad:'Birkaç tahmin, kalibrasyon defterine',k:['berrak','3.4'],bas:12,arac:'kalibrasyon'},
 {id:'ilkhamle',ad:'Bir ilk hamle',k:['iliski','3.1'],bas:24},
 {id:'ustalik',ad:'Sınırda sabit süre, üretim kaydı, bir öğretme',k:['ustalasma','3.5'],bas:35},
 {id:'katki',ad:'Bir küçük katkı',k:['katki','3.1'],bas:43,arac:'katki'},
 {id:'birkisi',ad:'Bir kişiye bir saat',k:['katki','3.4'],bas:43,arac:'katki'},
 {id:'amacsiz',ad:'Bir amaçsız saat',k:['oyun','3.1'],bas:43,arac:'oyun'}];
const AYLIK=[
 {id:'kalibakis',ad:'Kalibrasyon defterine bakış',k:['berrak','3.4'],bas:16,arac:'kalibrasyon'},
 {id:'sabitgun',ad:'Sabit günün tarihi konuldu',k:['iliski','3.2'],bas:24},
 {id:'birikim',ad:'Birikime bakış',k:['para','2.5'],bas:48}];
const SEYREK=[
 {id:'birakma',ad:'Bırakma günü',k:['karar','3.4'],h:[24,37,50,63,76,89,102]},
 {id:'harita',ad:'Sınır haritasını yeniden çiz',k:['ustalasma','3.1'],h:[35,42,55,68,81,94,107]},
 {id:'dikkatcumle',ad:'Yıllık dikkat cümlesi',k:['dikkat','4.4'],h:[6,48,100]},
 {id:'yillik',ad:'Yıllık oturum: kayıtları yan yana oku',k:['tanima','3.4'],h:[48,100]}];
const PAZAR_S=[
 {s:'Bu hafta ne bitirdim?',i:'Başladıklarını değil, bitirdiklerini. Liste boşsa bu bir bilgi, suçlama değil.'},
 {s:'Bu hafta hangi işim doğrudan kullanıcıya dokundu?',i:'Üst üste üç hafta cevap veremiyorsan üretmiyorsun, hazırlanıyorsun.'},
 {s:'Önümüzdeki haftanın tek önceliği ne?',i:'Bir tane. Liste değil.'}];
const BES_S=(S.bessoru.match(/^\d\. .+$/gm)||[]).map(x=>x.replace(/^\d\. /,''));
const YETER=[['para','Para'],['is','İş ve unvan'],['mulk','Mülk'],['gorunur','Görünürlük'],['basari','Başarı']];

/* ---------- okuma planı ---------- */
const OKUMA=[{w:0,id:'plan'},{w:0,id:'disiplin'}];
Object.values(S.hafta).sort((a,b)=>a.w-b.w).forEach(h=>{ h.oku.forEach(id=>OKUMA.push({w:h.w,id})); h.raf.forEach(id=>OKUMA.push({w:h.w,id,raf:true})); });
const OKW={}; OKUMA.forEach(o=>OKW[o.id]=o.w);
const METINLER=OKUMA.filter(o=>!o.raf&&o.id!=='plan').map(o=>o.id);

/* ---------- zaman çizelgesi ---------- */
const baslangic=()=>{ const s=al('ayar:baslangic'); return s?tarih(s):null; };
const program=id=>al('program:'+id,{durum:'bekliyor'});
function kesintiler(){ return anahtarlar('kesinti:').map(k=>al(k)).filter(x=>x&&x.bas).sort((a,b)=>a.bas<b.bas?-1:1); }
const aktifKesinti=()=>kesintiler().find(k=>!k.bit);
function kesintiGun(a,b){ let n=0; for(const k of kesintiler()){ const s=Math.max(+a,+tarih(k.bas)), e=Math.min(+b,+(k.bit?tarih(k.bit):bugun())); if(e>s) n+=fark(new Date(s),new Date(e)); } return n; }
function cizelge(){
  const S0=baslangic(); if(!S0) return null;
  const ek={}; PROG.forEach(p=>{ const u=program(p.id).uzatma||0; if(u) ek[p.gecis]=(ek[p.gecis]||0)+u*14; });
  const hiza={}; PROG.forEach(p=>{ const st=program(p.id); if(st.bas) hiza[p.bas]=tarih(st.bas); });
  const ks=kesintiler(), out=[]; let t=ekle(S0,-7);
  for(let w=0;w<=110;w++){
    if(hiza[w]){ const A=hiza[w]; while(out.length&&out[out.length-1].bas>=A) out.pop(); if(out.length) out[out.length-1].bit=A; t=A; }
    if(ek[w]){ out.push({tip:'uzatma',w,bas:t,bit:ekle(t,ek[w])}); t=ekle(t,ek[w]); }
    let son=ekle(t,7);
    for(const k of ks){ const b=tarih(k.bas); if(b>=t&&b<son){ const e=k.bit?tarih(k.bit):bugun(); son=ekle(son,Math.max(0,fark(b,e))); } }
    out.push({tip:'hafta',w,bas:t,bit:son}); t=son;
  }
  return out;
}
function simdi(){
  const c=cizelge(); if(!c) return {tip:'yok'};
  const b=bugun(); if(b<c[0].bas) return {tip:'once',gun:fark(b,c[0].bas)};
  const k=aktifKesinti(); const seg=c.find(s=>b>=s.bas&&b<s.bit)||c[c.length-1];
  if(k) return {tip:'kesinti',w:seg.w,k,gun:fark(tarih(k.bas),b)};
  return {tip:seg.tip,w:seg.w,seg};
}
const haftaBas=w=>{ const c=cizelge(); const s=c&&c.find(x=>x.tip==='hafta'&&x.w===w); return s?s.bas:null; };
function okumaHaftasi(){ const S0=baslangic(); if(!S0) return -1; const h0=ekle(S0,-7); const b=bugun(); if(b<h0) return -1; return Math.floor((fark(h0,b)-kesintiGun(h0,b))/7); }
const aktifProgram=()=>PROG.find(p=>program(p.id).durum==='aktif');
const siradaki=()=>PROG.find(p=>program(p.id).durum!=='tamam');
const uzunluk=p=>p.gun+(program(p.id).uzatma||0)*14;
function programGunu(p){ const st=program(p.id); if(!st.bas) return 0; const b=tarih(st.bas), e=st.durum==='tamam'&&st.bitis?tarih(st.bitis):bugun(); return fark(b,e)-kesintiGun(b,e)+1; }
const gunKaydi=(pid,n)=>al(`gun:${pid}:${n}`,{});
const fazBul=(p,n)=>p.fazlar.find(f=>n>=f[0]&&n<=f[1])||p.fazlar[p.fazlar.length-1];
function duyguGrup(){ const t=DOC.duygu&&DOC.duygu.test, a=al('test:duygu',[]); if(!t||!a.length) return null; const s=sayim(t,a[a.length-1].sec), mx=Math.max(...s); if(mx<=0) return null; const e=s.some(x=>x>=3)?3:mx; return t.gruplar.filter((g,i)=>s[i]>=e).map(g=>g.harf); }
function yonerge(p,n){
  const y=Y[p.id]; if(!y) return null; const f=fazBul(p,n), b=y.bolumler[f[3]]; if(!b) return null;
  const L=uzunluk(p), pz=bugun().getDay()===0, dg=duyguGrup(), icinde=a=>!a||(n>=a[0]&&n<=(a[1]>=p.gun-7?L:a[1]));
  const o={f,gunluk:[],isler:[],pazar:[],beklenir:b.beklenir,beklenmez:b.beklenmez};
  b.gruplar.forEach((g,gi)=>{ if(!icinde(g.a)||(g.pazar&&!pz)) return;
    g.maddeler.forEach((m,mi)=>{ if(!icinde(m.a)) return; if(g.grupsal&&dg&&m.h&&!dg.includes(m.h)) return;
      const x={k:f[3].replace('.','')+'-'+gi+'-'+mi,m:m.m,e:g.etiket}; (g.pazar?o.pazar:m.g?o.gunluk:o.isler).push(x); }); });
  return o;
}

/* ---------- iki gün kuralı zinciri ---------- */
function zincir(){
  const seri=[];
  for(const p of PROG){ const st=program(p.id); if(!st.bas) continue;
    const son=Math.min(uzunluk(p),programGunu(p)), akt=st.durum==='aktif';
    for(let n=1;n<=son;n++){ const x=!!gunKaydi(p.id,n).x; if(akt&&n===son&&!x) break; seri.push(x); } }
  let cur=0,max=0,kac=0,kopus=[];
  seri.forEach((x,i)=>{ if(x){ cur++; kac=0; } else { kac++; if(kac>=2){ if(cur>0) kopus.push(i); cur=0; } } max=Math.max(max,cur); });
  return {simdi:cur,en:max,dunKacti:seri.length>0&&!seri[seri.length-1]&&kac===1,seri,toplam:seri.filter(Boolean).length};
}

/* ---------- metin, test, kart ---------- */
const metin=id=>al('metin:'+id,{});
const okundu=id=>!!metin(id).okundu;
const kayitli=id=>{ const m=metin(id); return !!(m.m1&&m.m2&&m.m3); };
const testler=id=>al('test:'+id,[]);
function kartAcik(t){ return t.doc==='plan'||t.doc==='takvim'||okundu(t.doc); }
function sayim(t,sec){ return t.gruplar.map((g,gi)=>g.maddeler.reduce((n,_,mi)=>n+(sec.includes(gi+':'+mi)?1:0),0)); }
function kurallar(t,say){
  const harf=t.gruplar.map(g=>g.harf);
  return t.kurallar.filter(k=>{ const c=k.kosul;
    if(c.tip==='grup'){ const i=harf.indexOf(c.grup); return i>-1&&say[i]>=c.n; }
    if(c.tip==='adet'){ const a=say.filter(x=>x>=c.n).length; return a>=c.min&&a<=c.max; }
    if(c.tip==='enfazla') return say.every(x=>x<=c.n);
    return false; });
}

/* ---------- istatistik ---------- */
function istatistik(){
  const z=zincir(), tamam=PROG.filter(p=>program(p.id).durum==='tamam').map(p=>p.id);
  const c=MADDELER.filter(m=>(al('madde:'+m.id)||{}).durum==='yerlesti').length;
  const kayit=METINLER.filter(kayitli).length, oku=METINLER.filter(okundu).length;
  const deg=dizi(al('ayar:degerler',[])), yet=al('ayar:yeterince',{});
  const hz=dizi(al('hazirlik',{}).adim);
  return {z,tamam,c,kayit,oku,hazN:hz.filter(Boolean).length,degN:[0,1,2,3,4].filter(i=>deg[i]&&String(deg[i]).trim()).length,tanN:YETER.filter(([k])=>(yet[k]||'').trim()).length,gecisMax:Math.max(0,...PROG.map(p=>dizi(program(p.id).gecisAdim).filter(Boolean).length)),
    hazirlik:[0,1,2,3,4].every(i=>hz[i]),
    uzatma:PROG.some(p=>(program(p.id).uzatma||0)>0),
    donus:kesintiler().some(k=>k.bit),
    biray:METINLER.some(id=>metin(id).a1),
    test:S.docs.filter(d=>testler(d.id).length>0).length,
    tekrar:S.docs.some(d=>testler(d.id).length>1),
    pazar:anahtarlar('pazar:').filter(k=>al(k).kapali).length,
    aylik:anahtarlar('aylik:').filter(k=>al(k).kapali).length,
    gecis:PROG.filter(p=>dizi(program(p.id).gecisAdim).filter(Boolean).length>=7).length,
    tetik:anahtarlar('tetik:').length,
    kart:S.tetik.filter(kartAcik).length,
    degerler:[0,1,2,3,4].every(i=>deg[i]&&String(deg[i]).trim()),
    tanimlar:YETER.every(([k])=>(yet[k]||'').trim()),
    mezun:!!al('mezuniyet',{}).tarih};
}

/* ---------- mühürler: sayı değil, dönüm noktası ---------- */
const MUHUR=[
 {id:'defter',ad:'Defter açıldı',m:'0',sv:1,a:'Hafta 0 hazırlığının beş adımı tamam.',k:['takvim','2.2'],f:s=>s.hazirlik},
 {id:'ilkcarpi',ad:'İlk çarpı',m:'✕',sv:1,a:'İlk program gününü işaretledin.',k:['disiplin','5.9'],f:s=>s.z.toplam>=1},
 {id:'z7',ad:'Yedi gün',m:'7',sv:1,a:'İki gün kuralıyla yedi çarpılık zincir.',k:['disiplin','5.4'],f:s=>s.z.en>=7},
 {id:'z21',ad:'Yirmi bir',m:'21',sv:2,a:'Zincirde yirmi bir çarpı — disiplin programının ölçütü kadar.',k:['disiplin','5.9'],f:s=>s.z.en>=21},
 {id:'z60',ad:'Altmış',m:'60',sv:2,a:'Altmış çarpılık zincir. Tek bir kaçırma zinciri koparmıyor; iki kaçırma koparıyor.',k:['disiplin','5.4'],f:s=>s.z.en>=60},
 {id:'z150',ad:'Yüz elli',m:'150',sv:3,a:'Yüz elli çarpı. Bu artık bir program değil, bir alışkanlık.',k:['disiplin','5.1'],f:s=>s.z.en>=150},
 ...PROG.map(p=>({id:'p-'+p.id,ad:p.ad,m:String(p.no),sv:2,a:p.ad+' programının çıkış ölçütü tuttu.',k:[p.id,p.ilk],f:s=>s.tamam.includes(p.id)})),
 {id:'ilkgecis',ad:'İlk geçiş',m:'→',sv:1,a:'Bir geçiş haftasının yedi adımını tamamladın.',k:['takvim','5.1'],f:s=>s.gecis>=1},
 {id:'durust',ad:'Dürüst ölçüt',m:'±',sv:2,a:'Ölçüt tutmadı dedin ve uzattın. Kendini kandırmamak da bir varış.',k:['plan','3.2'],f:s=>s.uzatma},
 {id:'donus',ad:'Geri dönüş',m:'↺',sv:2,a:'Bir kesintiden sonra döndün. Kesinti bir veri noktası, borç değil.',k:['plan','3.5'],f:s=>s.donus},
 {id:'ilkkayit',ad:'İlk metin kaydı',m:'A',sv:1,a:'Üç madde ve bir bağlantı cümlesi.',k:['ogrenme','5.3'],f:s=>s.kayit>=1},
 {id:'bes',ad:'Beş metin',m:'5',sv:1,a:'Beş metin okundu ve kaydedildi.',k:['ogrenme','5.3'],f:s=>s.kayit>=5},
 {id:'yariyol',ad:'Yarı yol',m:'12',sv:2,a:'On iki metin okundu ve kaydedildi.',k:['ogrenme','5.3'],f:s=>s.kayit>=12},
 {id:'hepsi',ad:'Yirmi üç metin',m:'23',sv:3,a:'Rafta bekleyen dışında bütün metinler okundu ve kaydedildi.',k:['plan','2.2'],f:s=>s.kayit>=23},
 {id:'biray',ad:'Bir ay sonra',m:'30',sv:1,a:'Bir metnin bir ay sonraki kontrolü yapıldı.',k:['ogrenme','5.3'],f:s=>s.biray},
 {id:'ilktest',ad:'Kendini yerleştir',m:'?',sv:1,a:'İlk testini çözdün.',k:['disiplin','1.5'],f:s=>s.test>=1},
 {id:'oncesonra',ad:'Öncesi ve sonrası',m:'⇄',sv:2,a:'Bir testi tekrar çözdün; iki sonuç yan yana.',k:['tanima','3.1'],f:s=>s.tekrar},
 {id:'ilkc',ad:'İlk yerleşen',m:'C',sv:2,a:'C bölümüne ilk madde geçti.',k:['plan','4.1'],f:s=>s.c>=1},
 {id:'altic',ad:'Arka plan kuruldu',m:'C6',sv:3,a:'C bölümünde altı madde — planın dürüst ölçütü.',k:['plan','4.3'],f:s=>s.c>=6},
 {id:'onikic',ad:'On iki yerleşen',m:'C12',sv:3,a:'C bölümünde on iki madde.',k:['plan','4.3'],f:s=>s.c>=12},
 {id:'ilkpazar',ad:'İlk pazar',m:'P',sv:1,a:'İlk haftalık gözden geçirme.',k:['disiplin','5.8'],f:s=>s.pazar>=1},
 {id:'onpazar',ad:'On pazar',m:'10',sv:2,a:'On haftalık gözden geçirme.',k:['disiplin','5.8'],f:s=>s.pazar>=10},
 {id:'kirkpazar',ad:'Kırk pazar',m:'40',sv:3,a:'Kırk haftalık gözden geçirme.',k:['disiplin','5.8'],f:s=>s.pazar>=40},
 {id:'ilkay',ad:'İlk aylık oturum',m:'Ay',sv:1,a:'İlk aylık geçiş ve beş soru.',k:['plan','4.2'],f:s=>s.aylik>=1},
 ...FAZLAR.map(f=>({id:'faz'+f.no,ad:f.ad,m:['I','II','III','IV'][f.no-1],sv:3,a:`Faz ${['I','II','III','IV'][f.no-1]} tamam: ${f.p.map(x=>PID[x].ad.toLocaleLowerCase('tr')).join(' ve ')}.`,k:['takvim','3.'+f.no],f:s=>f.p.every(x=>s.tamam.includes(x))})),
 {id:'kart',ad:'Kart işe yaradı',m:'K',sv:1,a:'Tetiklenenler kartından bir pratiği kullandın.',k:['takvim','4.5'],f:s=>s.tetik>=1},
 {id:'kartdolu',ad:'Kart doldu',m:'18',sv:2,a:'Kartın on sekiz satırının hepsi açık.',k:['takvim','4.5'],f:s=>s.kart>=18},
 {id:'degerler',ad:'Beş değer',m:'D',sv:1,a:'Beş değerin yazılı ve sıralı.',k:['degerler','3.2'],f:s=>s.degerler},
 {id:'tanimlar',ad:'Beş tanım',m:'Y',sv:1,a:'Beş alanda yeterince tanımı yazıldı.',k:['yeterince','3.1'],f:s=>s.tanimlar},
 {id:'mezuniyet',ad:'Mezuniyet',m:'48',sv:4,a:'Kırk sekiz haftanın sonu. İskele söküldü; geriye arka plan kaldı.',k:['sinir','3.5'],f:s=>s.mezun}
];

/* ---------- senkron: Firebase, isteğe bağlı ---------- */
const FB='https://www.gstatic.com/firebasejs/10.12.2/';
const HATA={'auth/invalid-email':'E-posta adresi geçersiz.','auth/invalid-credential':'E-posta ya da şifre yanlış.','auth/wrong-password':'E-posta ya da şifre yanlış.','auth/user-not-found':'E-posta ya da şifre yanlış.','auth/email-already-in-use':'Bu e-postayla bir hesap var. Giriş yap.','auth/weak-password':'Şifre en az altı karakter olmalı.','auth/network-request-failed':'Bağlantı yok. İnternet gelince tekrar dene.','auth/too-many-requests':'Çok fazla deneme. Biraz bekle.'};
function ondeMi(u){ for(const k in depo.r){ const x=u[k]; if(!x||depo.r[k].t>x.t) return true; } return false; }
const SENKRON_SINIR=1000000;
const senkronBoyut=v=>{ try{ return new Blob([JSON.stringify(v)]).size; }catch(e){ return JSON.stringify(v).length; } };
const senkron={durum:'kapali',kullanici:null,m:null,dinle:null,z:null,hata:'',
  async kur(){
    const cfg=window.FIREBASE_CONFIG;
    if(!cfg||!cfg.apiKey){ this.durum='kurulmadi'; nokta(); return; }
    try{ this.durum='bekliyor'; nokta();
      const [app,auth,fs]=await Promise.all([import(FB+'firebase-app.js'),import(FB+'firebase-auth.js'),import(FB+'firebase-firestore.js')]);
      this.m={auth,fs}; const a=app.initializeApp(cfg); this.auth=auth.getAuth(a); this.db=fs.getFirestore(a);
      auth.onAuthStateChanged(this.auth,u=>{ this.kullanici=u; if(u) this.baglan(); else { this.kopar(); this.durum='cikis'; } nokta(); if(rota().ad==='ayarlar') ciz(true); });
    }catch(e){ this.durum='yok'; nokta(); }
  },
  baglan(){ const {fs}=this.m, ref=fs.doc(this.db,'defterler',this.kullanici.uid); this.kopar();
    this.dinle=fs.onSnapshot(ref,snap=>{ if(snap.metadata.hasPendingWrites) return;
      const r=(snap.exists()&&snap.data().r)||{};
      if(birlestir(r)){ sonrasi({sessiz:true,uzaktan:true}); if(!yaziyor()) ciz(true); }
      if(ondeMi(r)) this.it(true); this.durum='bagli'; nokta();
    },()=>{ this.durum='hata'; nokta(); }); },
  kopar(){ if(this.dinle){ this.dinle(); this.dinle=null; } },
  it(hemen){ if(!this.kullanici||!this.m) return; clearTimeout(this.z); this.z=setTimeout(()=>this.yaz(),hemen?60:1500); },
  async yaz(){ const {fs}=this.m, veri={r:temiz(depo.r),u:Date.now()};
    if(senkronBoyut(veri)>SENKRON_SINIR){ this.durum='hata'; this.hata='Kayıtlar senkron sınırını (1 MB) aştı; bulut kopyası artık güncellenmiyor. Yedeği indir.'; nokta(); return; }
    try{ await fs.setDoc(fs.doc(this.db,'defterler',this.kullanici.uid),veri); this.durum='bagli'; this.hata=''; }catch(e){ this.durum='hata'; } nokta(); },
  async giris(e,p,yeni){ this.hata=''; try{ const f=yeni?this.m.auth.createUserWithEmailAndPassword:this.m.auth.signInWithEmailAndPassword; await f(this.auth,e,p); bildiri(yeni?'Hesap oluşturuldu. Senkron açık.':'Giriş yapıldı. Senkron açık.'); }
    catch(x){ this.hata=HATA[x.code]||('Olmadı: '+(x.code||x.message)); } ciz(true); },
  async cikis(){ await this.m.auth.signOut(this.auth); bildiri('Çıkış yapıldı. Kayıtlar bu cihazda duruyor.'); }
};
function nokta(){ const n=$('#nokta'); if(!n) return; const d=senkron.durum; n.dataset.d=d==='bagli'?'bagli':d==='hata'?'hata':d==='bekliyor'?'bekliyor':''; n.title={bagli:'Senkron açık',hata:'Senkron hatası',bekliyor:'Bağlanıyor',cikis:'Senkron için giriş yap',kurulmadi:'Senkron kurulmadı',yok:'Senkron yüklenemedi',kapali:'Senkron kapalı'}[d]||''; }
const yaziyor=()=>{ const a=document.activeElement; return a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&/text|email|password|number|date/.test(a.type))); };

/* ---------- mühür ve kutlama ---------- */
function muhurSVG(m,t,kilit){
  if(kilit) return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="84" fill="none" stroke="var(--cizgi)" stroke-width="3" stroke-dasharray="6 8"/><text x="100" y="116" text-anchor="middle" style="font:600 44px var(--yazi);fill:var(--cizgi)">?</text></svg>`;
  const r=(hash(m.id)%15)-7, id='mh'+hash(m.id+t), fs=m.ad.length>15?15:18, tar=t?kisa(tarih(t))+' '+tarih(t).getFullYear():'';
  const isin=m.sv>=4?Array.from({length:36},(_,i)=>{ const a=i*Math.PI/18; return `<line x1="${(100+93*Math.cos(a)).toFixed(1)}" y1="${(100+93*Math.sin(a)).toFixed(1)}" x2="${(100+99*Math.cos(a)).toFixed(1)}" y2="${(100+99*Math.sin(a)).toFixed(1)}" stroke="currentColor" stroke-width="2"/>`; }).join(''):'';
  return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(m.ad)} mührü"><defs><path id="${id}a" d="M 30 100 A 70 70 0 0 1 170 100"/><path id="${id}b" d="M 36 106 A 64 64 0 0 0 164 106"/></defs>
<g transform="rotate(${r} 100 100)" filter="url(#murekkep)" style="color:var(--muhur)">${isin}
<circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" stroke-width="${m.sv>=2?6:4}"/>
${m.sv>=2?'<circle cx="100" cy="100" r="79" fill="none" stroke="currentColor" stroke-width="1.6"/>':''}
${m.sv>=3?'<circle cx="100" cy="100" r="47" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 4"/>':''}
<text style="font:700 ${fs}px var(--yazi);letter-spacing:1.4px;fill:currentColor"><textPath href="#${id}a" startOffset="50%" text-anchor="middle">${esc(m.ad)}</textPath></text>
<text x="100" y="${m.m.length>2?111:117}" text-anchor="middle" style="font:700 ${m.m.length>2?28:40}px var(--yazi);fill:currentColor">${esc(m.m)}</text>
${tar?`<text style="font:400 22px var(--el);fill:currentColor"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${esc(tar)}</textPath></text>`:''}
</g></svg>`;
}
const kuyruk=[]; let hesap=false;
function sonrasi(o={}){
  if(!hesap){ hesap=true;
    try{ const s=istatistik(), yeni=[];
      for(const m of MUHUR){ if(!al('muhur:'+m.id)&&m.f(s)){ depo.r['muhur:'+m.id]={v:{tarih:ymd(bugun())},t:Date.now()}; yeni.push(m); } }
      if(yeni.length){ sakla(); senkron.it(); if(!o.uzaktan){ kuyruk.push(...yeni); setTimeout(kutla,o.sessiz?600:250); } }
    }finally{ hesap=false; } }
  if(!o.sessiz) ciz(true);
}
function kutla(){
  if(!kuyruk.length||$('.perde')) return;
  const m=kuyruk.shift(), t=al('muhur:'+m.id).tarih;
  levha(`<div class="kutlama">${muhurSVG(m,t)}<h2>${esc(m.ad)}</h2><p>${esc(m.a)}</p><p class="kaynak"><a href="${bolum(m.k[0],m.k[1])}" data-is="kapat">${esc(docAd(m.k[0]))} ${m.k[1]}</a></p>
  <div class="sira" style="justify-content:center"><button class="dugme dolu" data-is="kapat">Deftere bas</button></div></div>`,()=>setTimeout(kutla,200));
}
let levhaSon=null;
function levha(html,kapaninca){
  kapatLevha(); const p=document.createElement('div'); p.className='perde';
  p.innerHTML=`<div class="levha" role="dialog" aria-modal="true"><div class="tutamac"></div>${html}</div>`;
  p.addEventListener('click',e=>{ if(e.target===p) kapatLevha(); });
  document.body.appendChild(p); levhaSon=kapaninca||null; const f=p.querySelector('button,a,input,textarea'); if(f) f.focus({preventScroll:true});
}
function kapatLevha(){ const p=$('.perde'); if(p){ p.remove(); const f=levhaSon; levhaSon=null; if(f) f(); } }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') kapatLevha(); });
function bildiri(t,eylem){
  const eski=$('.bildiri'); if(eski) eski.remove();
  const b=document.createElement('div'); b.className='bildiri'; b.setAttribute('role','status');
  b.innerHTML=`<span>${esc(t)}</span>${eylem?`<button>${esc(eylem.ad)}</button>`:''}`;
  if(eylem) b.querySelector('button').onclick=()=>{ b.remove(); eylem.f(); };
  document.body.appendChild(b); setTimeout(()=>b.remove(),eylem?9000:3200);
}

/* ---------- ikonlar ---------- */
const sv=(d,x='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${x}>${d}</svg>`;
const IK={
  bugun:sv('<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>'),
  yol:sv('<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>'),
  kitap:sv('<path d="M4.5 4.5h4v15h-4zM10 4.5h4v15h-4zM15.6 5.4l3.6-.9 2.9 14.6-3.6.9z"/>'),
  defter:sv('<rect x="4.5" y="3.5" width="15" height="17" rx="1.5"/><path d="M8.5 3.5v17M11 8h6M11 11.5h6M11 15h4"/>'),
  muhur:sv('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5" stroke-dasharray="2 2.2"/>'),
  kart:sv('<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M7 10h6M7 13.5h9"/>'),
  ayar:sv('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  geri:sv('<path d="M14.5 5.5L8 12l6.5 6.5"/>')
};

/* ---------- yönlendirme ve çizim ---------- */
const V={}; let sonRota='';
function rota(){ const p=location.hash.replace(/^#\/?/,'').split('/'); return {ad:p[0]||'bugun',a:p[1]?decodeURIComponent(p[1]):'',b:p[2]||''}; }
const SESLI='aeıioöuüâîûAEIİOÖUÜÂÎÛ';
function hecele(w){ const v=[...w].map((c,i)=>SESLI.includes(c)?i:-1).filter(i=>i>=0), k=[]; for(let x=0;x<v.length-1;x++){ const a=v[x], b=v[x+1], n=b-a-1; k.push(n===0?b:n===1?b-1:n===2?a+2:b-1); } return k; }
const kenarNot=k=>{ if(typeof k!=='string'||k.length<=6||!/^[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+$/.test(k)) return k; let o='',s=0; hecele(k).filter(i=>i>=2&&k.length-i>=2).forEach(i=>{ o+=k.slice(s,i)+'\u00AD'; s=i; }); return o+k.slice(s); };
const blok=(k,ic,x='')=>`<section class="blok"${x}><div class="kenar-not">${kenarNot(k)}</div><div class="ic">${ic}</div></section>`;
const dugme=(t,h,s='')=>`<a class="dugme ${s}" href="${h}">${esc(t)}</a>`;
const kareler=(n,top,x='x')=>`<div class="kareler" role="img" aria-label="${n}/${top}">${Array.from({length:top},(_,i)=>`<i class="${i<n?x:''}"></i>`).join('')}</div>`;
const rehberMod=()=>al('ayar:gorunum','rehber')!=='ayrintili';
IK.daha=sv('<circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/>');
const NAVR=[['bugun','Bugün',IK.bugun],['yol','Yol',IK.yol],['kitaplik','Kitaplık',IK.kitap],['daha','Daha fazla',IK.daha]];
const NAVAR={kurulum:'bugun',kayit:'kitaplik',hatirla:'kitaplik',oku:'kitaplik',test:'kitaplik',kayitokuma:'daha',arac:'daha',defter:'daha',muhurler:'daha',kart:'daha',ayarlar:'daha',kesinti:'daha',pazar:'bugun',aylik:'bugun',baslangic:'bugun',gecis:'bugun',mezuniyet:'bugun',basla:'bugun'};
const NAV=[['bugun','Bugün',IK.bugun],['yol','Yol',IK.yol],['kitaplik','Kitaplık',IK.kitap],['defter','Defter',IK.defter],['muhurler','Mühürler',IK.muhur]];
const NAVA={hatirla:'kitaplik',kayitokuma:'defter',muhurler:'muhurler',arac:'defter',oku:'kitaplik',test:'kitaplik',pazar:'defter',aylik:'defter',baslangic:'defter',gecis:'bugun',kesinti:'bugun',mezuniyet:'bugun',kart:'bugun',ayarlar:'bugun'};
function ciz(koru){
  const r=rota(), key=r.ad+'/'+r.a, kok=$('#uygulama');
  if(r.ad==='oku'&&koru&&sonRota===key&&$('#metin')){ okuGuncelle(r); return; }
  const y=koru&&sonRota===key?scrollY:null;
  const o=(V[r.ad]||V.bugun)(r), rm=rehberMod(), ak=rm?(NAVAR[r.ad]||r.ad):(NAVA[r.ad]||r.ad), nav=rm?NAVR:NAV;
  kok.innerHTML=`<div class="sayfa"><header class="ust">${o.geri?`<button class="ikon geri" data-is="geri" aria-label="Geri">${IK.geri}</button>`:'<span></span>'}
<h1>${esc(o.baslik)}${o.alt?`<span class="alt-baslik">${esc(o.alt)}</span>`:''}</h1>
<div class="araclar"><span class="senkron" id="nokta"></span>${rm?'':`<a class="ikon" href="#/kart" aria-label="Tetiklenenler kartı">${IK.kart}</a>`}<a class="ikon" href="#/ayarlar" aria-label="Ayarlar">${IK.ayar}</a></div></header>
<main id="ana">${o.html}</main></div>
<div class="alt"><nav aria-label="Ana gezinme">${nav.map(([k,t,i])=>`<a href="#/${k}"${k===ak?' aria-current="page"':''}>${i}<span>${t}</span></a>`).join('')}</nav></div>`;
  $$('#ana label.alan:not([for])').forEach((l,i)=>{ const e=l.nextElementSibling; if(e&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)){ if(!e.id) e.id='alan-'+i; l.htmlFor=e.id; } });
  sonRota=key; if(o.sonra) o.sonra(r);
  if(y!=null) scrollTo(0,y); else if(!(r.ad==='oku'&&r.b)) scrollTo(0,0);
  nokta();
}
window.addEventListener('hashchange',()=>{ kapatLevha(); ciz(); });
window.addEventListener('storage',e=>{ if(e.key!==ANAHTAR||!e.newValue) return; let j=null; try{ j=JSON.parse(e.newValue); }catch(_){ return; } if(j&&j.r&&birlestir(j.r)){ sonrasi({sessiz:true,uzaktan:true}); if(!yaziyor()) ciz(true); } });

/* ---------- olaylar ---------- */
const IS={}, DEG={};
document.addEventListener('click',e=>{ const t=e.target.closest('[data-is]'); if(!t) return; const f=IS[t.dataset.is]; if(f){ if(t.tagName!=='A'||t.dataset.is!=='kapat') e.preventDefault(); f(t,e); } });
document.addEventListener('change',e=>{ const t=e.target; if(t.dataset.rk&&t.dataset.yazi===undefined) bagla(t); else if(t.dataset.deg&&DEG[t.dataset.deg]) DEG[t.dataset.deg](t); });
document.addEventListener('input',e=>{ const t=e.target; if(t.dataset.rk&&t.dataset.yazi!==undefined) bagla(t); });
function deger(t){ return t.type==='checkbox'?t.checked:t.type==='number'?(t.value===''?null:Number(t.value)):t.value; }
function bagla(t){
  const rk=t.dataset.rk, yol=t.dataset.yol, yazi=t.dataset.yazi!==undefined;
  const kaydet=()=>{ let v=deger(t); if(yol){ const kok=/^\d+$/.test(yol.split('.')[0]); let rec=klon(al(rk,kok?[]:{}))||(kok?[]:{}); if(kok) rec=dizi(rec); yolKoy(rec,yol,v); v=rec; } koy(rk,v,{sessiz:yazi||t.dataset.sessiz==='1'}); };
  if(yazi){ clearTimeout(t._z); t._k=kaydet; t._z=setTimeout(()=>{ t._z=null; kaydet(); },450); } else kaydet();
}
IS.geri=()=>{ if(history.length>1) history.back(); else location.hash='#/bugun'; };
IS.kapat=()=>kapatLevha();

/* ---------- sıradaki mühür ---------- */
const ILER={defter:s=>[s.hazN,5],ilkcarpi:s=>[s.z.toplam,1],z7:s=>[s.z.simdi,7],z21:s=>[s.z.simdi,21],z60:s=>[s.z.simdi,60],z150:s=>[s.z.simdi,150],
 ilkgecis:s=>[s.gecisMax,7],ilkkayit:s=>[s.kayit,1],bes:s=>[s.kayit,5],yariyol:s=>[s.kayit,12],hepsi:s=>[s.kayit,23],ilktest:s=>[s.test,1],
 ilkc:s=>[s.c,1],altic:s=>[s.c,6],onikic:s=>[s.c,12],ilkpazar:s=>[s.pazar,1],onpazar:s=>[s.pazar,10],kirkpazar:s=>[s.pazar,40],ilkay:s=>[s.aylik,1],
 kart:s=>[s.tetik,1],kartdolu:s=>[s.kart,18],degerler:s=>[s.degN,5],tanimlar:s=>[s.tanN,5],mezuniyet:()=>{ const x=simdi(); return [x.w>0?Math.min(x.w,48):0,48]; }};
PROG.forEach(p=>{ ILER['p-'+p.id]=()=>{ const st=program(p.id); return [st.durum==='aktif'?Math.min(programGunu(p),uzunluk(p)):0,uzunluk(p)]; }; });
FAZLAR.forEach(f=>{ ILER['faz'+f.no]=s=>[f.p.filter(x=>s.tamam.includes(x)).length,f.p.length]; });
const ILER_BIRIM={z7:'şimdiki zincir',z21:'şimdiki zincir',z60:'şimdiki zincir',z150:'şimdiki zincir',mezuniyet:'hafta',ilkgecis:'adım',defter:'adım'};
const pasifMuhur=id=>/^(p-|faz)/.test(id)||id==='mezuniyet'||id==='kartdolu';
function muhurIler(m,s){ const f=ILER[m.id]; if(!f) return null; const [n,h]=f(s); return {n:Math.max(0,Math.min(n,h)),h}; }
function siradakiMuhur(s,aktif){ s=s||istatistik(); let en=null;
  MUHUR.forEach(m=>{ if(al('muhur:'+m.id)||(aktif&&pasifMuhur(m.id))) return; const x=muhurIler(m,s); if(!x||x.n>=x.h) return; const o=x.n/x.h;
    if(!en||o>en.o||(o===en.o&&o>0&&(x.h-x.n)<(en.h-en.n))) en={m,n:x.n,h:x.h,o}; });
  return en; }
const ilerYazi=(m,x)=>m.id.startsWith('p-')?`gün ${x.n}/${x.h}`:`${x.n}/${x.h}${ILER_BIRIM[m.id]?' '+ILER_BIRIM[m.id]:''}`;
const ilerCubuk=(x,ad)=>`<span class="ilerleme" role="progressbar" aria-label="${esc(ad||(x.m?x.m.ad+' ilerlemesi':'İlerleme'))}" aria-valuemin="0" aria-valuemax="${x.h}" aria-valuenow="${x.n}"><i style="width:${Math.round(100*x.n/x.h)}%"></i></span>`;

/* ---------- kapat ve hatırla ---------- */
function hatirlaKutu(d,i,kapali){ const b=(d.hatirla||[])[i]; if(!b) return ''; const k='hatirla:'+d.id, c=(al(k,{})||{}).c||{}, bol=d.bolumler.filter(x=>x.no.split('.')[0]===b.k);
  return `<blockquote class="kutu etkin" data-kutu="${i}"><h3>Kapat ve hatırla — Kısım ${esc(b.k)}</h3><p>${kapali?'Metin kapalı. Cevapla, sonra kontrol et.':'Aşağı kaydırma. Cevapla, sonra kontrol et.'}</p><ol>${b.s.map((q,j)=>`<li><span class="soru">${q}</span><textarea class="yazi" rows="${Math.max(2,Math.ceil((c[i+'-'+j]||'').length/34))}" data-rk="${k}" data-yol="c.${i}-${j}" data-yazi aria-label="Cevap ${j+1}">${esc(c[i+'-'+j]||'')}</textarea></li>`).join('')}</ol><div class="sira"><button class="cip" data-is="hatirlaKontrol">Kontrol et</button></div><div class="kontrol" hidden><p class="aciklama">Cevaplarını metinle karşılaştır:</p><div class="sira" style="margin-top:.2rem">${bol.map(x=>`<a class="cip" href="#/oku/${d.id}/${x.a}">${x.no} ${esc(x.ad)}</a>`).join('')}</div></div></blockquote>`; }
const kutuluHtml=d=>d.html.replace(/<blockquote class="kutu" data-kutu="(\d+)">[\s\S]*?<\/blockquote>/g,(x,i)=>hatirlaKutu(d,+i)||x);
function hatirlaSay(d){ const c=(al('hatirla:'+d.id,{})||{}).c||{}; let n=0,m=0; (d.hatirla||[]).forEach((b,i)=>b.s.forEach((_,j)=>{ m++; if((c[i+'-'+j]||'').trim()) n++; })); return {n,m}; }
IS.hatirlaKontrol=t=>{ const d=t.closest('blockquote.kutu').querySelector('.kontrol'); if(d){ d.hidden=!d.hidden; t.textContent=d.hidden?'Kontrol et':'Gizle'; } };
IS.hatirlaYeni=t=>{ const k='hatirla:'+t.dataset.id, rec=klon(al(k,{}))||{}; if(!Object.values(rec.c||{}).some(x=>(x||'').trim())){ bildiri('Arşivlenecek cevap yok.'); return; }
  if(!confirm('Cevaplar arşive kalksın, alanlar boşalsın mı? Yeni tur, yeni hatırlama.')) return; rec.gecmis=dizi(rec.gecmis).concat([{tarih:ymd(bugun()),c:rec.c}]); rec.c={}; koy(k,rec); };
V.hatirla=r=>{ const d=DOC[r.a]; if(!d||!(d.hatirla||[]).length) return {baslik:'Kapat ve hatırla',geri:1,html:blok('',`<p>Bu metinde soru yok.</p>`)};
  const x=hatirlaSay(d), g=dizi((al('hatirla:'+d.id,{})||{}).gecmis);
  return {baslik:'Kapat ve hatırla',alt:d.baslik,geri:1,html:blok(`<b>${x.n}</b>/${x.m}`,`<p style="margin-top:0">Metin kapalı. Her soruyu hatırladığın kadar yaz, sonra kontrol et. <a class="ref" href="${bolum('ogrenme','3.2')}">Öğrenme 3.2</a></p>${g.length?`<p class="ipucu">Önceki turlar: ${g.map(t=>kisa(tarih(t.tarih))).join(', ')}.</p>`:''}`)
   +`<article class="okuma kapali">${d.hatirla.map((_,i)=>hatirlaKutu(d,i,true)).join('')}</article>`
   +blok('',`<div class="sira" style="margin-top:0"><button class="dugme" data-is="hatirlaYeni" data-id="${d.id}">Yeni tur</button>${dugme('Metne dön','#/oku/'+d.id,'ince')}</div><p class="ipucu">Yeni tur cevapları arşive kaldırır. Bir hafta ve bir ay sonra boş alanlarla yeniden dene.</p>`)}; };

/* ---------- yazı boyutu ve yazdırma ---------- */
const OLCEK=[['kucuk','Küçük',.92],['normal','Normal',1],['buyuk','Büyük',1.12],['cokbuyuk','Çok büyük',1.26]];
function yaziUygula(){ const o=OLCEK.find(x=>x[0]===al('ayar:yazi','normal'))||OLCEK[1]; document.documentElement.style.setProperty('--olcek',String(o[2])); }
IS.yaziBoyut=t=>{ const i=Math.max(0,OLCEK.findIndex(x=>x[0]===al('ayar:yazi','normal'))), j=Math.max(0,Math.min(OLCEK.length-1,i+(+t.dataset.v))); koy('ayar:yazi',OLCEK[j][0],{sessiz:true}); yaziUygula(); bildiri('Yazı: '+OLCEK[j][1].toLocaleLowerCase('tr')); };
IS.yaziSec=t=>{ koy('ayar:yazi',t.dataset.v); yaziUygula(); };
IS.yazdir=()=>window.print();
window.addEventListener('beforeprint',()=>$$('textarea').forEach(x=>{ x._h=x.style.height; x.style.height='auto'; x.style.height=x.scrollHeight+'px'; }));
window.addEventListener('afterprint',()=>$$('textarea').forEach(x=>{ x.style.height=x._h||''; }));

/* ---------- takvim dosyası ---------- */
const icsK=v=>String(v==null?'':v).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
const duz=v=>String(v||'').replace(/\*\*|\*|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1');
const u8=ch=>{ const c=ch.codePointAt(0); return c<128?1:c<2048?2:c<65536?3:4; };
function icsKatla(v){ let out='',sat='',n=0,sinir=75; for(const ch of v){ const b=u8(ch); if(n+b>sinir){ out+=sat+'\r\n '; sat=''; n=0; sinir=74; } sat+=ch; n+=b; } return out+sat; }
const icsGun=d=>ymd(d).replace(/-/g,'');
function icsUret(){
  const c=cizelge(); if(!c) return null;
  const saat=String(al('ayar:oturumSaat','19:00')||'19:00').slice(0,5), [hh,mm]=saat.split(':').map(Number), iki=x=>String(x).padStart(2,'0');
  const hmA=iki(hh)+iki(mm)+'00', t2=(hh*60+mm+20)%1440, hmB=iki(Math.floor(t2/60))+iki(t2%60)+'00';
  const damga=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,''), L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Defter//Gelisim Serisi//TR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Defter'];
  const olay=o=>{ L.push('BEGIN:VEVENT','UID:'+o.uid+'@defter','DTSTAMP:'+damga);
    if(o.gun) L.push('DTSTART;VALUE=DATE:'+icsGun(o.gun),'DTEND;VALUE=DATE:'+icsGun(ekle(o.gun,1)),'TRANSP:TRANSPARENT');
    else L.push('DTSTART:'+icsGun(o.bas)+'T'+o.hm,'DURATION:PT'+o.dk+'M');
    if(o.rrule) L.push('RRULE:'+o.rrule);
    L.push('SUMMARY:'+icsK(o.baslik)); if(o.aciklama) L.push('DESCRIPTION:'+icsK(o.aciklama));
    if(o.alarm) L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsK(o.baslik),'TRIGGER:PT0M','END:VALARM');
    L.push('END:VEVENT'); };
  const hf=c.filter(x=>x.tip==='hafta'&&x.w<=48), son=hf[hf.length-1], until=icsGun(ekle(son.bit,-1))+'T235959';
  c.forEach(seg=>{
    if(seg.tip==='uzatma'){ const p=PROG.find(x=>x.gecis===seg.w); olay({uid:'uzatma-'+seg.w,gun:seg.bas,baslik:`Defter · Uzatma: ${p?p.ad:'program'}, ${fark(seg.bas,seg.bit)} gün`,aciklama:'Ölçüt tutmadı, program uzatıldı. Takvim bu kadar kayıyor.'}); return; }
    if(seg.w>48) return;
    if(seg.w===0){ olay({uid:'hafta-0',gun:seg.bas,baslik:'Defter · Hafta 0: Hazırlık',aciklama:S.hazirlik.map(x=>duz(x.gun+': '+x.metin)).join('\n')}); return; }
    const h=S.hafta[seg.w]; if(!h) return;
    const yeni=[...HAFTALIK,...AYLIK].filter(x=>x.bas===seg.w&&x.bas>1).map(x=>x.ad), sy=SEYREK.filter(x=>x.h.includes(seg.w));
    const ac=[h.oku.length?'Oku: '+h.oku.map(docAd).join(', '):'',h.raf.length?'Rafa: '+h.raf.map(docAd).join(', '):'',...h.not.map(duz),yeni.length?'Devreye giriyor: '+yeni.join(', '):'',sy.length?'Bu hafta: '+sy.map(x=>x.ad).join(', '):''].filter(Boolean).join('\n');
    olay({uid:'hafta-'+seg.w,gun:seg.bas,baslik:`Defter · Hafta ${seg.w}: ${h.etiket}`,aciklama:ac});
    sy.forEach(x=>olay({uid:`seyrek-${x.id}-${seg.w}`,gun:ekle(seg.bas,5),baslik:'Defter · '+x.ad,aciklama:`${docAd(x.k[0])} ${x.k[1]}`})); });
  PROG.forEach(p=>{ const st=program(p.id), b=st.bas?tarih(st.bas):haftaBas(p.bas), g=haftaBas(p.gecis), d=DOC[p.id];
    if(b) olay({uid:'program-'+p.id,gun:b,baslik:`Defter · ${p.ad} programı başlıyor`,aciklama:`${uzunluk(p)} gün. İlk gün: ${docAd(p.id)} ${p.ilk}.`});
    if(g) olay({uid:'gecis-'+p.id,gun:g,baslik:`Defter · Geçiş: ${p.ad} çıkış ölçütü`,aciklama:duz(d&&d.cikis)}); });
  const b1=haftaBas(1);
  if(b1){ olay({uid:'pazar',bas:ekle(b1,6),hm:hmA,dk:20,rrule:`FREQ=WEEKLY;BYDAY=SU;UNTIL=${until}`,baslik:'Defter · Pazar gözden geçirmesi',aciklama:PAZAR_S.map((x,i)=>`${i+1}. ${x.s}`).join('\n'),alarm:true});
    const ilkP=(y,m)=>{ const x=new Date(y,m,1); while(x.getDay()!==0) x.setDate(x.getDate()+1); return x; }; let a=ilkP(b1.getFullYear(),b1.getMonth()); if(a<b1) a=ilkP(b1.getFullYear(),b1.getMonth()+1);
    olay({uid:'aylik',bas:a,hm:hmB,dk:30,rrule:`FREQ=MONTHLY;BYDAY=1SU;UNTIL=${until}`,baslik:'Defter · Aylık oturum',aciklama:'Yerleşti, sürüyor, gitti. Ve beş soru.',alarm:true}); }
  L.push('END:VCALENDAR'); return L.map(icsKatla).join('\r\n')+'\r\n';
}
IS.ics=()=>{ const t=icsUret(); if(!t){ bildiri('Önce başlangıç tarihini seç.'); return; } const b=new Blob([t],{type:'text/calendar;charset=utf-8'}), a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='defter-takvim.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); bildiri('Takvim dosyası indirildi.'); };
const icsAlani=s0=>`<p style="margin:1.3rem 0 0"><strong>Takvim dosyası</strong></p><p class="aciklama" style="margin-top:.2rem">Hafta başları, program başlangıçları ve geçiş haftaları, pazar ve aylık oturumlar, seyrek oturumlar. Telefonun takvimine aktar.</p>${s0?`<label class="alan" for="os">Oturum saati</label><input class="yazi" type="time" id="os" data-rk="ayar:oturumSaat" value="${esc(al('ayar:oturumSaat','19:00'))}"><div class="sira"><button class="dugme" data-is="ics">Takvim dosyasını indir</button></div><p class="ipucu">Ayrı bir takvime aktar. Uzatma ya da kesinti olursa o takvimi silip dosyayı yeniden indir.</p>`:'<p class="ipucu">Önce başlangıç tarihini seç.</p>'}`;

/* ================= BUGÜN ================= */
function kurulum(){
  const p=pazartesi(bugun()), oneri=ymd(ekle(p,14));
  return blok('Başla',`<h2 class="bas">Takvimin başlangıcını seç</h2>
<p>Tarih, Hafta 1'in pazartesi günü. Ondan önceki hafta Hafta 0: hazırlık. Mezuniyet, kırk sekiz hafta sonra.</p>
<label class="alan" for="bt">Hafta 1'in pazartesisi</label><input class="yazi" type="date" id="bt" value="${oneri}">
<p class="ipucu">Hangi günü seçersen seç, o haftanın pazartesisine yuvarlanır.</p>
<p class="ipucu">Kayıtlar bu cihazda saklanır. Ayarlar'dan yedek alabilir ya da senkron kurabilirsin.</p>
<div class="sira"><button class="dugme dolu" data-is="baslangic">Takvimi kur</button>${dugme('Önce planı oku','#/oku/plan','ince')}</div>`);
}
IS.baslangic=()=>{ const v=$('#bt').value; if(!v) return; koy('ayar:baslangic',ymd(pazartesi(tarih(v)))); kaliciIste(); bildiri('Takvim kuruldu. Hafta 0 hazırlık haftası.'); location.hash='#/bugun'; };
function zincirSeridi(z){
  const son=z.seri.slice(-13); const bosluk=14-son.length-1;
  const kopuk=i=>{ const j=z.seri.length-son.length+i; return !z.seri[j]&&(z.seri[j-1]===false||z.seri[j+1]===false); };
  return `<div class="zincir" role="img" aria-label="Son günler">${Array.from({length:Math.max(0,bosluk)},()=>'<i style="opacity:.25"></i>').join('')}${son.map((x,i)=>`<i class="${x?'x':''}${!x&&kopuk(i)?' kopuk':''}"></i>`).join('')}<i class="bugun"></i></div>`;
}
function gunBlogu(p){
  const n=programGunu(p), L=uzunluk(p), g=gunKaydi(p.id,n), f=fazBul(p,n), z=zincir(), st=program(p.id);
  if(n>L) return blok(`<b>${L}</b>gün`,`<h2 class="bas">${esc(p.ad)}: gün doldu</h2><p>Programın ${L} günü tamam. Geçiş haftası yedi adım: önce kendi testini yeniden çöz, sonra çıkış ölçütü.</p><div class="sira">${dugme('Geçişe başla','#/gecis/'+p.id,'dolu')}</div>`);
  const m=p.metrik, mv=g.m==null?'':g.m, y=yonerge(p,n), gc=g.c||{}, fz=al('faz:'+p.id,{}), il=al('ilk:'+p.id,{}), yil=Y[p.id], D0=DOC[p.id];
  const kutu=(at,ch,ic,ek='')=>`<label class="onay"><input type="checkbox" ${at} ${ch?'checked':''}><span class="kutu"></span><span>${ic}${ek?`<small>${esc(ek)}</small>`:''}</span></label>`;
  let rehber='';
  if(yil&&n<=3&&!yil.ilk.every((_,i)=>il['k'+i])) rehber+=`<h3 class="bas">İlk gün</h3>${yil.ilk.map((x,i)=>kutu(`data-rk="ilk:${p.id}" data-yol="k${i}"`,il['k'+i],baglantili(D0,x))).join('')}`;
  if(y&&y.gunluk.length) rehber+=`<h3 class="bas">Bugün</h3>${y.gunluk.map(x=>kutu(`data-deg="gunMadde" data-p="${p.id}" data-n="${n}" data-k="${x.k}"`,gc[x.k],baglantili(D0,x.m),/^(Her gün|Günlük)$/.test(x.e)?'':x.e)).join('')}`;
  if(y&&y.pazar.length) rehber+=`<h3 class="bas">Bugün pazar</h3>${y.pazar.map(x=>kutu(`data-deg="gunMadde" data-p="${p.id}" data-n="${n}" data-k="${x.k}"`,gc[x.k],baglantili(D0,x.m))).join('')}`;
  if(y&&y.isler.length){ const yap=y.isler.filter(x=>fz[x.k]).length;
    rehber+=`<details class="rehber"${yap<y.isler.length&&n-y.f[0]<7?' open':''}><summary><strong>Bu fazın işleri</strong> <span class="aciklama">${yap}/${y.isler.length}</span></summary>${y.isler.map(x=>kutu(`data-rk="faz:${p.id}" data-yol="${x.k}"`,fz[x.k],baglantili(D0,x.m),x.e==='Bu hafta'?'':x.e)).join('')}</details>`; }
  if(y&&(y.beklenir||y.beklenmez)) rehber+=`<details class="rehber"><summary>Ne beklenir, ne beklenmez</summary>${y.beklenir?`<p><strong>Ne beklenir:</strong> ${md(y.beklenir)}</p>`:''}${y.beklenmez?`<p><strong>Ne beklenmez:</strong> ${md(y.beklenmez)}</p>`:''}</details>`;
  const alty=y&&y.gunluk.length?`${y.gunluk.length} günlük madde aşağıda; hepsi işaretlenince çarpı kendiliğinden atılır.`:esc(p.gorev);
  const ek2=(p.ekler||[]).map((e,ei)=>`<label class="alan" for="ek${ei}">${esc(e.ad)}${e.birim?' ('+e.birim+')':''}</label><input class="yazi" id="ek${ei}" type="number" inputmode="numeric" min="0" data-rk="gun:${p.id}:${n}" data-yol="${e.alan}" data-yazi value="${g[e.alan]==null?'':g[e.alan]}">`).join('')+(p.id==='disiplin'||p.id==='bitirme'?projeSatir():'')+(p.id==='para'?paraSatir():'')+(p.id==='ustalasma'?ustalikSatir():'')+(p.id==='dikkat'?dikkatSatir():'')+(p.id==='duygu'?`<div class="sira" style="margin-top:.5rem"><a class="cip" href="#/arac/duygu/yeni">Tetiklenme satırı ekle</a><a class="cip pasif" href="#/arac/duygu">Tablo</a></div>`:'');
  return blok(`<b>${n}</b>/${L}`,`<h2 class="bas">${esc(p.ad)}</h2><p class="aciklama">${esc(f[2])}${st.uzatma?`, uzatma ${st.uzatma}`:''}</p>
<div class="gunluk"><button class="carpi" data-is="carpi" data-p="${p.id}" data-n="${n}" aria-pressed="${!!g.x}" aria-label="Bugünün maddesi yapıldı"><svg viewBox="0 0 64 64"><path d="M14 14 L50 50"/><path d="M50 14 L14 50"/></svg></button>
<div class="carpi-yazi"><b>${g.x?'Bugün yapıldı':'Bugünün maddesi'}</b><span>${alty}</span></div></div>
${m.tip==='evet'?`<label class="onay"><input type="checkbox" data-rk="gun:${p.id}:${n}" data-yol="m" ${g.m?'checked':''}><span class="kutu"></span><span>${esc(m.ad)}</span></label>`
:`<label class="alan" for="mt">${esc(m.ad)}${m.birim?' ('+m.birim+')':''}</label><input class="yazi" id="mt" type="number" inputmode="numeric" min="0" data-rk="gun:${p.id}:${n}" data-yol="m" data-yazi value="${mv}">`}
${ek2}${rehber}
${zincirSeridi(z)}
<p class="ipucu">Zincir: ${z.simdi} çarpı.${z.dunKacti?' <strong>Dün kaçtı; bugün de kaçarsa zincir kopar.</strong>':''} Tek kaçırma zinciri koparmıyor, üst üste iki kaçırma koparıyor.</p>
<div class="sira"><a class="cip" href="${bolum(p.id,f[3])}">${esc(f[2])} bölümü</a><a class="cip" href="${bolum(p.id,p.asgari)}">Asgari mod</a><a class="cip" href="${bolum(p.id,p.olcum)}">Ölçüm</a><a class="cip" href="#/defter/b">Günlük</a></div>`);
}
DEG.gunMadde=t=>{ const pid=t.dataset.p, n=+t.dataset.n, k=`gun:${pid}:${n}`, g=klon(gunKaydi(pid,n))||{}; g.c=g.c||{}; g.c[t.dataset.k]=t.checked;
  const y=yonerge(PID[pid],n), oto=!!(y&&y.gunluk.length&&y.gunluk.every(x=>g.c[x.k])&&!g.x);
  if(oto){ g.x=true; g.tarih=ymd(bugun()); } koy(k,g); if(oto) bildiri('Günlük maddelerin hepsi tamam: çarpı atıldı.'); };
IS.carpi=t=>{ const k=`gun:${t.dataset.p}:${t.dataset.n}`, g=klon(gunKaydi(t.dataset.p,+t.dataset.n))||{}; g.x=!g.x; g.tarih=ymd(bugun()); koy(k,g); };
function baslatBlogu(p,s){
  const erken=s.w<p.bas, onceki=PROG[PROG.indexOf(p)-1], bekle=onceki&&program(onceki.id).durum!=='tamam';
  if(bekle) return '';
  return blok('Sıradaki',`<h2 class="bas">${esc(p.ad)} programı</h2><p class="aciklama">${p.gun} gün, takvimde Hafta ${p.bas}${erken?` — ${p.bas-s.w} hafta sonra`:''}</p>
<p><strong>Çıkış ölçütü:</strong> ${md(DOC[p.id].cikis.replace(/ Tutmadıysa.*$/,''))}</p>
<div class="sira"><button class="dugme ${erken?'':'dolu'}" data-is="basla" data-p="${p.id}">Programı başlat</button><a class="cip" href="${bolum(p.id,p.ilk)}">İlk gün</a><a class="cip" href="#/oku/${p.id}">Metin</a></div>
${erken?'<p class="ipucu">Takvimden önce başlamak serbest; plan yalnızca aynı anda tek program ister.</p>':''}`);
}
IS.basla=t=>{ const id=t.dataset.p; if(aktifProgram()){ bildiri('Önce aktif programı bitir: aynı anda tek program.'); return; } koy('program:'+id,Object.assign(klon(program(id)),{durum:'aktif',bas:ymd(bugun()),uzatma:program(id).uzatma||0})); bildiri(PID[id].ad+' başladı. İlk gün bölümü seni bekliyor.'); };
function okumaBlogu(){
  const ow=okumaHaftasi(); if(ow<0) return '';
  const due=OKUMA.filter(o=>!o.raf&&o.w<=ow&&!okundu(o.id)).slice(0,3); if(!due.length) return '';
  return blok('Okuma',`<ul class="liste">${due.map(o=>`<li><a class="satir" href="#/oku/${o.id}"><span class="no">${DOC[o.id].no||'—'}</span><span>${esc(docAd(o.id))}</span><span class="durum">Hafta ${o.w}</span></a></li>`).join('')}</ul>
<p class="ipucu">İki haftada bir metin. Okuduktan sonra dosyayı kapat, üç madde yaz.</p>`);
}
function incelemeler(){
  const b=bugun(), out=[];
  S.docs.forEach(d=>{ const m=metin(d.id); if(!m.okundu) return; const o=tarih(m.okundu);
    if(!m.g1&&b>=ekle(o,1)) out.push({id:d.id,a:'g1',t:'Ertesi gün: bakmadan hatırla, sonra kontrol et'});
    else if(!m.h1&&b>=ekle(o,7)) out.push({id:d.id,a:'h1',t:'Bir hafta sonra: değişikliği yaptın mı?'});
    else if(!m.a1&&b>=ekle(o,30)) out.push({id:d.id,a:'a1',t:'Bir ay sonra: değişiklik yerleşti mi?'}); });
  return out;
}
function incelemeBlogu0(){
  const l=incelemeler(); if(!l.length) return '';
  return blok('Tekrar',`${l.slice(0,4).map(x=>`<div style="margin-bottom:.9rem"><strong>${esc(docAd(x.id))}</strong><br><span class="aciklama">${esc(x.t)}</span>
<div class="sira" style="margin-top:.3rem">${x.a==='g1'?`<button class="cip" data-is="incele" data-id="${x.id}" data-a="g1" data-v="1">Yaptım</button>`
:`<button class="cip" data-is="incele" data-id="${x.id}" data-a="${x.a}" data-v="1">Evet</button><button class="cip" data-is="incele" data-id="${x.id}" data-a="${x.a}" data-v="0">Hayır</button>`}${x.a==='g1'&&DOC[x.id]&&(DOC[x.id].hatirla||[]).length?`<a class="cip" href="#/hatirla/${x.id}">Soruları aç</a>`:''}<a class="cip pasif" href="#/defter/a">Kaydım</a></div></div>`).join('')}`);
}
IS.incele=t=>{ const id=t.dataset.id, rec=klon(metin(id)); rec[t.dataset.a]=ymd(bugun()); rec[t.dataset.a+'v']=t.dataset.v==='1'; koy('metin:'+id,rec); };
function ritimBlogu(s){
  const b=bugun(), g=b.getDay(), out=[];
  const pk='pazar:'+ymd(pazartesi(b));
  if((g===0||g===6)&&s.w>=1&&!(al(pk)||{}).kapali) out.push(`<p><strong>Pazar gözden geçirmesi</strong><br><span class="aciklama">Üç soru, yirmi dakika.</span></p><div class="sira">${dugme('Gözden geçir','#/pazar','dolu')}</div>`);
  const ak='aylik:'+ymd(b).slice(0,7), ilkPazar=(()=>{ const x=new Date(b.getFullYear(),b.getMonth(),1); while(x.getDay()!==0) x.setDate(x.getDate()+1); return x; })();
  if(s.w>=1&&b>=ilkPazar&&!(al(ak)||{}).kapali) out.push(`<p><strong>Aylık oturum</strong><br><span class="aciklama">Yerleşti, sürüyor, gitti — ve beş soru.</span></p><div class="sira">${dugme('Oturumu aç','#/aylik')}</div>`);
  SEYREK.filter(x=>x.h.includes(s.w)).forEach(x=>{ const k=`seyrek:${x.id}:${s.w}`; out.push(`<label class="onay"><input type="checkbox" data-rk="${k}" ${al(k)?'checked':''}><span class="kutu"></span><span><strong>${esc(x.ad)}</strong><small><a href="${bolum(x.k[0],x.k[1])}">${esc(docAd(x.k[0]))} ${x.k[1]}</a>${x.arac?` — <a href="#/arac/${x.arac}">defteri aç</a>`:''}${x.id==='yillik'?' — <a href="#/kayitokuma">kayıt okuması</a>':''}</small></span></label>`); });
  const yeni=[...HAFTALIK,...AYLIK].filter(x=>x.bas===s.w&&x.bas>1);
  if(yeni.length) out.push(`<p style="margin-top:.8rem"><strong>Bu hafta devreye giriyor</strong></p>${yeni.map(x=>`<a class="cip" href="${bolum(x.k[0],x.k[1])}">${esc(x.ad)}</a>`).join('')}`);
  return out.length?blok('Ritim',out.join('')):'';
}
function notBlogu(s){
  const h=S.hafta[s.w]; if(!h||!h.not.length) return '';
  return blok(`Hafta ${s.w}`,`<p class="aciklama" style="margin-top:0">${esc(h.etiket)}</p><ul style="margin:.2rem 0 0;padding-left:1.1rem">${h.not.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`);
}
function aktifAy(){ const S0=baslangic(); if(!S0) return 0; const b=bugun(); return (fark(S0,b)-kesintiGun(S0,b))/30.44; }
const bugunAyrintili=()=>{
  if(!baslangic()) return {baslik:'Defter',alt:'Kurulum',html:kurulum()};
  const s=simdi(), b=bugun(); let baslik, alt=`${gunAdi(b)}, ${uzun(b)}`; const h=[];
  if(s.tip==='once'){ baslik='Başlamadan önce'; alt=`Hafta 0'a ${s.gun} gün`;
    h.push(blok('Bekle',`<h2 class="bas">Hafta 0, ${uzun(ekle(baslangic(),-7))} pazartesi başlıyor.</h2><p>O güne kadar yapılacak bir şey yok. İstersen planı şimdiden oku; takvim, uygulama ve kart hazır.</p><div class="sira">${dugme('Planı aç','#/oku/plan')}${dugme('Yolu gör','#/yol','ince')}</div>`));
    return {baslik,alt,html:h.join('')}; }
  if(s.tip==='kesinti'){ baslik='Kesinti'; alt=`${s.gun+1}. gün`;
    h.push(blok('Kesinti',`<h2 class="bas">Program duraklatıldı</h2><p>${s.gun+1} gündür kesintidesin. Takvim bu süre kadar kayıyor; kesinti bir veri noktası, borç değil.</p><div class="sira">${dugme('Dönüş protokolü','#/kesinti','dolu')}</div>`)); }
  else if(s.w===0){ baslik='Hafta 0: Hazırlık';
    const ad=dizi(al('hazirlik',{}).adim), L=[['#/oku/plan','Plan'],['#/oku/disiplin','Disiplin'],['#/baslangic','Beş soru'],[bolum('disiplin','5.9'),'Disiplin 5.9'],['','']];
    h.push(blok('Hazırlık',`<h2 class="bas">Yedi gün</h2>${S.hazirlik.map((x,i)=>`<label class="onay"><input type="checkbox" data-rk="hazirlik" data-yol="adim.${i}" ${ad[i]?'checked':''}><span class="kutu"></span><span><strong>${esc(x.gun)}</strong> ${md(x.metin)}${L[i][0]?` <a href="${L[i][0]}">${L[i][1]}</a>`:''}</span></label>`).join('')}
<p class="ipucu">Hazırlık bir hafta. Yedinci gün defter eksik olsa da Hafta 1 başlıyor.</p>`)); }
  else baslik=s.tip==='uzatma'?`Hafta ${s.w} · uzatma`:`Hafta ${s.w}`;
  if(s.tip!=='kesinti'&&s.w>=1){ const p=aktifProgram(); if(p) h.push(gunBlogu(p)); else { const n=siradaki(); if(n) h.push(baslatBlogu(n,s)); } }
  if(s.tip!=='kesinti'){ h.push(okumaBlogu(),incelemeBlogu(),yedekBlogu(),ritimBlogu(s),notBlogu(s)); }
  const mz=al('mezuniyet',{}); if(!mz.tarih&&(PROG.every(p=>program(p.id).durum==='tamam')||aktifAy()>=11)) h.push(blok('Varış',`<h2 class="bas">Mezuniyet zamanı</h2><p>${PROG.every(p=>program(p.id).durum==='tamam')?'Sekiz programın hepsi tamam.':'On bir aktif ay doldu.'} Mezuniyet haftası: iki oturum ve bir kayıt.</p><div class="sira">${dugme('Mezuniyete geç','#/mezuniyet','dolu')}</div>`));
  if(s.tip!=='kesinti'){ const sm=siradakiMuhur(null,true); if(sm&&sm.n>0&&(sm.h-sm.n<=2||sm.o>=.8)) h.push(blok('Mühür',`<p style="margin:0">Sıradaki mühür: <strong>${esc(sm.m.ad)}</strong>, ${ilerYazi(sm.m,sm)}.</p>${ilerCubuk(sm)}<div class="sira" style="margin-top:.2rem">${dugme('Mühürler','#/muhurler','ince')}</div>`)); }
  const acik=S.tetik.filter(kartAcik).length;
  h.push(blok('Kart',`<p style="margin:0">Tetiklenenler kartında ${acik} satır açık. Bir durum gelince bak.</p><div class="sira">${dugme('Kartı aç','#/kart','ince')}</div>`));
  return {baslik,alt,html:h.join('')};
};

/* ---------- ilk açılış, yol, kitaplık ---------- */
const hosgeldin=()=>blok('Defter',`<h2 class="bas is">Kırk sekiz hafta, sekiz program</h2><p>Yirmi dört metinlik serinin uygulama defteri. Her gün tek iş, birkaç dakika.</p><a class="dugme dolu genis" href="#/kurulum/0">Başlayalım</a>`);
V.kurulum=r=>{ const i=Math.max(0,Math.min(3,+r.a||0)), s0=al('ayar:baslangic',''), oneri=s0||ymd(ekle(pazartesi(bugun()),14));
  const A=[`<h2 class="bas is">Bu defter ne?</h2><p>Yirmi dört metinlik serinin uygulama defteri. Kırk sekiz hafta, sekiz program — aynı anda tek program, sırayla.</p><p>Metinleri okumak için değil, okuduğunu uygulamak için. Günde birkaç dakika.</p>`,
   `<h2 class="bas is">Nasıl işliyor?</h2><p>Her gün tek kart: bugünün işi, senin yazdığın "ne zaman, nerede" cümlesi ve tek düğme. Kötü günler için zor gün sürümü var; onu yapmak da zinciri koruyor.</p><p>Haftada bir pazar oturumu, ayda bir kısa oturum. Program bitince tek soru: varış ölçütü tuttu mu?</p>`,
   `<h2 class="bas is">Ne zaman başlıyorsun?</h2><p>Seçtiğin tarih Hafta 1'in pazartesisi. Ondan önceki hafta Hafta 0: hazırlık. Mezuniyet kırk sekiz hafta sonra.</p><label class="alan" for="bt">Hafta 1'in pazartesisi</label><input class="yazi" type="date" id="bt" value="${oneri}"><p class="ipucu">Hangi günü seçersen seç, o haftanın pazartesisine yuvarlanır.</p>`,
   `<h2 class="bas is">Kayıtların nerede duruyor?</h2><p>Her şey bu cihazda, çevrimdışı çalışıyor. Bulut kopyası istersen senkronu kur; istemezsen ayda bir yedek al — uygulama bunu kendisi hatırlatacak.</p>${s0?`<p class="el">Hafta 1: ${uzun(tarih(s0))}</p>`:''}<div class="sira">${dugme('Senkron ve yedek','#/ayarlar','ince')}</div>`];
  return adimSayfa({baslik:'Başlangıç',alt:'Kurulum',i,n:4,ic:A[i],geriH:i>0?`#/kurulum/${i-1}`:'',
    ileri:i===2?{etiket:s0?'Tarihi güncelle':'Takvimi kur',is:'kurulumTarih'}:i===3?{etiket:"Hafta 0'a başla",h:'#/bugun'}:{etiket:'Devam',h:`#/kurulum/${i+1}`}}); };
IS.kurulumTarih=()=>{ const e=$('#bt'); if(!e||!e.value){ bildiri('Bir tarih seç.'); return; } koy('ayar:baslangic',ymd(pazartesi(tarih(e.value))),{sessiz:true}); kaliciIste(); bildiri('Takvim kuruldu.'); location.hash='#/kurulum/3'; };
V.yol=r=>rehberMod()&&r.a!=='tum'?yolRehber():yolAyrintili();
function yolRehber(){
  if(!baslangic()) return {baslik:'Yol',html:hosgeldin()};
  const s=simdi(), w=s.tip==='once'?0:Math.max(0,s.w||0), st=istatistik(), mez=haftaBas(48), mzt=mez?ekle(mez,7):null, sm=siradakiMuhur(st), h=S.hafta[w];
  const satir=p=>{ const x=program(p.id), n=Math.min(programGunu(p),uzunluk(p)), ak=x.durum==='aktif';
    const d=x.durum==='tamam'?`tamam${x.bitis?', '+kisa(tarih(x.bitis)):''}`:ak?`gün ${n} / ${uzunluk(p)}`:`takvimde Hafta ${p.bas}`;
    return `<li><a class="satir yol-satir" href="#/oku/${p.id}"><span class="no">${x.durum==='tamam'?'✓':ak?'●':'○'}</span><span><strong>${esc(p.ad)}</strong><br><span class="aciklama">${d}${x.uzatma?`, uzatma ${x.uzatma}`:''}</span>${ak?ilerCubuk({n,h:uzunluk(p)},p.ad+' ilerlemesi'):''}</span><span class="durum">${uzunluk(p)} gün</span></a></li>`; };
  return {baslik:'Yol',alt:`Hafta ${w} / 48${mzt?' · mezuniyet '+kisa(mzt):''}`,html:
   blok(`<b>${w}</b>/48`,`<h2 class="bas is">${w===0?'Hazırlık haftası':esc((h&&h.etiket)||'Yolun sonu')}</h2>${h&&h.oku.length?`<p class="aciklama">Bu haftanın okuması: ${h.oku.map(id=>`<a class="ref" href="#/oku/${id}">${esc(docAd(id))}</a>`).join(', ')}</p>`:''}${h&&h.not.length?`<ul style="margin:.3rem 0 0;padding-left:1.1rem">${h.not.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}`)
  +blok('Programlar',`<ul class="liste">${PROG.map(satir).join('')}</ul>`)
  +(sm?blok('Sırada',`<p style="margin-top:0">Sıradaki dönüm noktası: <strong>${esc(sm.m.ad)}</strong>, ${ilerYazi(sm.m,sm)}.</p>${ilerCubuk(sm)}<div class="sira" style="margin-top:.2rem">${dugme('Dönüm noktaları','#/muhurler','ince')}</div>`):'')
  +blok('Sayılar',`<p style="margin:0">Programlar ${st.tamam.length}/8</p>${kareler(st.tamam.length,8)}<p style="margin:.6rem 0 0">Metin kaydı ${st.kayit}/23</p>${kareler(st.kayit,23)}<p style="margin:.6rem 0 0">Yerleşen madde ${st.c}</p>${kareler(Math.min(st.c,12),12)}<div class="sira">${dugme('Takvimin tamamı','#/yol/tum','ince')}${dugme('Ara ver','#/kesinti','ince')}</div>`)}; }
function siradakiOkuma(){ const ow=okumaHaftasi(); if(ow<0) return '';
  const o=OKUMA.find(x=>!x.raf&&x.w<=ow&&!okundu(x.id));
  if(!o) return blok('Sırada','<p style="margin-top:0">Takvimdeki metinlerin hepsi okundu.</p>');
  const d=DOC[o.id]; return blok('Sırada',`<h2 class="bas is">${esc(d.baslik)}</h2><p class="aciklama">Hafta ${o.w} · yaklaşık ${Math.round(d.kelime/220)} dakika</p><a class="dugme dolu genis" href="#/oku/${o.id}">Oku</a>`); }

/* ---------- adım adım akışlar ---------- */
function adimSayfa(o){ const f=o.ileri;
  const ileri=!f?'':f.is?`<button class="dugme dolu genis" data-is="${f.is}" ${f.data||''}>${esc(f.etiket)}</button>`:`<button class="dugme dolu genis" data-is="adimGit" data-h="${f.h}"${f.sart?` data-sart="${f.sart}"`:''}${f.mesaj?` data-mesaj="${esc(f.mesaj)}"`:''}>${esc(f.etiket)}</button>`;
  return {baslik:o.baslik,alt:`${o.alt} · ${o.i+1} / ${o.n}`,geri:1,html:blok(`<b>${o.i+1}</b>/${o.n}`,o.ic+ileri+(o.geriH?`<div class="sira" style="justify-content:center;margin-top:.3rem">${dugme('Geri',o.geriH,'ince')}</div>`:'')+noktalar(o.i,o.n))}; }
IS.adimGit=t=>{ yaziBosalt(); if(t.dataset.sart){ const [kk,yy]=t.dataset.sart.split('|'); if(!String((al(kk,{})||{})[yy]||'').trim()){ bildiri('Kısa da olsa bir cümle yaz.'); const e=$('#ana textarea'); if(e) e.focus(); return; } } if(t.dataset.mesaj) bildiri(t.dataset.mesaj); location.hash=t.dataset.h; };
const pratikKutu=(k,rec,x)=>`<label class="onay"><input type="checkbox" data-rk="${k}" data-yol="pratik.${x.id}" ${rec.pratik&&rec.pratik[x.id]?'checked':''}><span class="kutu"></span><span>${esc(x.ad)}<small><a href="${bolum(x.k[0],x.k[1])}">${esc(docAd(x.k[0]))} ${x.k[1]}</a>${x.arac?` — <a href="#/arac/${x.arac}">aç</a>`:''}</small></span></label>`;
const ikili=(is,k,veri,v,d,e,ad)=>`<div class="uclu" style="grid-template-columns:1fr 1fr" role="group" aria-label="${esc(ad)}"><button data-is="${is}" data-k="${k}" ${veri} data-v="1" aria-pressed="${v===true}">${d}</button><button data-is="${is}" data-k="${k}" ${veri} data-v="0" aria-pressed="${v===false}">${e}</button></div>`;
V.pazar=r=>rehberMod()?pazarRehber(r):pazarAyrintili();
function pazarRehber(r){
  const b=bugun(), k='pazar:'+ymd(pazartesi(b)), rec=al(k,{})||{}, w=Math.max(0,simdi().w||0), A=[];
  PAZAR_S.forEach((q,i)=>A.push(`<h2 class="bas is">${esc(q.s)}</h2><p class="aciklama">${esc(q.i)}</p><textarea class="yazi" rows="3" data-rk="${k}" data-yol="s${i}" data-yazi aria-label="${esc(q.s)}">${esc(rec['s'+i]||'')}</textarea>`));
  if(w>0&&w%17===0) A.push(`<h2 class="bas is">Dört ayda bir: hâlâ doğru şeyi mi yapıyorum?</h2><textarea class="yazi" rows="3" data-rk="${k}" data-yol="buyuk" data-yazi aria-label="Hâlâ doğru şeyi mi yapıyorum?">${esc(rec.buyuk||'')}</textarea>`);
  const pr=HAFTALIK.filter(x=>w>=x.bas); if(pr.length) A.push(`<h2 class="bas is">Bu hafta yaptıkların</h2>${pr.map(x=>pratikKutu(k,rec,x)).join('')}${ARAC.kalibrasyon.acik()&&w>=12?`<p class="ipucu">Kalibrasyon: birkaç tahmin ekle, sonucu belli olanları işaretle. <a class="ref" href="#/arac/kalibrasyon">Aç</a></p>`:''}`);
  const yer=MADDELER.filter(m=>(al('madde:'+m.id)||{}).durum==='yerlesti');
  if(yer.length) A.push(`<h2 class="bas is">Yerleşenler duruyor mu?</h2><p class="aciklama">Düştüyse ceza yok: bir kademe geri, kesinti kuralı.</p>${yer.map(m=>`<div style="margin:.5rem 0"><p style="margin:0">${esc(m.ad)}</p>${ikili('duruyor',k,`data-id="${m.id}"`,rec.duruyor?rec.duruyor[m.id]:undefined,'Duruyor','Düştü',m.ad)}</div>`).join('')}`);
  const dg=dizi(al('ayar:degerler',[])), degAktif=w>=34&&[0,1,2,3,4].every(i=>dg[i]&&String(dg[i]).trim());
  if(degAktif) A.push(`<h2 class="bas is">Bu hafta her değerin için bir şey yaptın mı?</h2>${dg.map((d,i)=>`<div style="margin:.45rem 0"><p style="margin:0">${i+1}. ${esc(d)}</p>${ikili('degerIsaret',k,`data-i="${i}"`,rec.deger?rec.deger[i]:undefined,'Evet','Hayır',d)}</div>`).join('')}`);
  const kap=anahtarlar('pazar:').filter(x=>x!==k).sort().map(x=>al(x)).filter(x=>x&&x.kapali), son2=kap.slice(-2);
  const bos=son2.length===2&&son2.every(x=>!(x.s1||'').trim())&&!(rec.s1||'').trim();
  const son3=kap.slice(-2).concat([rec]), alarm=degAktif&&son3.length===3?dg.filter((_,i)=>son3.every(x=>x.deger&&x.deger[i]===false)):[];
  A.push(`<h2 class="bas is">${rec.kapali?'Bu hafta kapandı':'Haftayı kapat'}</h2><p>${rec.kapali?'Gelecek pazar yeniden.':'Yazdıkların kaydedildi. Kapatınca hafta bitmiş sayılır.'}</p>${bos?'<p class="sonuc"><strong>Üç haftadır ikinci soru boş.</strong> Üretmiyorsun, hazırlanıyorsun. Bu bir bilgi, suçlama değil.</p>':''}${alarm.length?`<p class="sonuc"><strong>Üç hafta üst üste "hayır":</strong> ${alarm.map(esc).join(', ')}. Ya takvim değişecek ya liste.</p>`:''}`);
  const i=Math.max(0,Math.min(A.length-1,+r.a||0)), son=i===A.length-1;
  return adimSayfa({baslik:'Pazar gözden geçirmesi',alt:`${kisa(pazartesi(b))} haftası`,i,n:A.length,ic:A[i],geriH:i>0?`#/pazar/${i-1}`:'',
    ileri:son?(rec.kapali?{etiket:'Bugün ekranına dön',h:'#/bugun'}:{etiket:'Haftayı kapat',is:'haftaBitir',data:`data-k="${k}"`}):{etiket:'Devam',h:`#/pazar/${i+1}`}}); }
IS.haftaBitir=t=>{ yaziBosalt(); const k=t.dataset.k, rec=klon(al(k,{}))||{}; rec.kapali=true; rec.tarih=ymd(bugun()); koy(k,rec,{sessiz:true}); bildiri('Hafta kapandı.'); location.hash='#/bugun'; };
V.aylik=r=>rehberMod()?aylikRehber(r):aylikAyrintili();
function aylikRehber(r){
  const b=bugun(), k='aylik:'+ymd(b).slice(0,7), rec=al(k,{})||{}, w=Math.max(0,simdi().w||0), kh=kalanHafta(), A=[];
  A.push(`<h2 class="bas is">Beş soru</h2><p class="aciklama">Otuz saniye; ilk gelen cevap. <a class="ref" href="${bolum('plan','5.2')}">Plan 5.2</a></p>${BES_S.map((q,i)=>`<label class="alan"><strong>${i+1}.</strong> ${esc(q)}</label><textarea class="yazi" rows="1" data-rk="${k}" data-yol="c${i}" data-yazi>${esc(rec['c'+i]||'')}</textarea>`).join('')}`);
  PROG.filter(p=>program(p.id).durum!=='bekliyor').forEach(p=>A.push(`<h2 class="bas is">${esc(p.ad)}: ne yerleşti?</h2><p class="aciklama">Her madde için yerleşti, sürüyor ya da gitti. Gittiyse nedenini tek cümleyle yaz. <a class="ref" href="${bolum('plan','4.2')}">Plan 4.2</a></p>${MADDELER.filter(m=>m.pid===p.id).map(maddeSatiri).join('')}`));
  const kv=MADDELER.filter(m=>m.kavram&&okundu(m.doc)); if(kv.length) A.push(`<h2 class="bas is">Okuduğun metinlerin pratikleri</h2>${kv.map(maddeSatiri).join('')}`);
  const pr=AYLIK.filter(x=>w>=x.bas); if(pr.length) A.push(`<h2 class="bas is">Bu ayın pratikleri</h2>${pr.map(x=>pratikKutu(k,rec,x)).join('')}`);
  if(w>=34&&kh!=null) A.push(`<h2 class="bas is">Dört bin haftanın kalanı</h2><p class="buyuk-sayi">${kh.toLocaleString('tr-TR')}</p><p class="aciklama">Beş dakika bak, sonra kapat. <a class="ref" href="${bolum('zaman','3.1')}">Zaman 3.1</a></p>`);
  if(!senkronAcik()) A.push(`<h2 class="bas is">Yedek</h2><p>${yedekDurum()}</p><button class="dugme genis" data-is="disari">Yedeği indir</button>`);
  A.push(`<h2 class="bas is">${rec.kapali?'Bu ay kapandı':'Ayı kapat'}</h2><p>${rec.kapali?'Gelecek ay yeniden.':'Kapatınca bu ayın oturumu bitmiş sayılır.'}</p>`);
  const i=Math.max(0,Math.min(A.length-1,+r.a||0)), son=i===A.length-1;
  return adimSayfa({baslik:'Aylık oturum',alt:b.toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),i,n:A.length,ic:A[i],geriH:i>0?`#/aylik/${i-1}`:'',
    ileri:son?(rec.kapali?{etiket:'Bugün ekranına dön',h:'#/bugun'}:{etiket:'Ayı kapat',is:'ayBitir',data:`data-k="${k}"`}):{etiket:'Devam',h:`#/aylik/${i+1}`}}); }
IS.ayBitir=t=>{ yaziBosalt(); const k=t.dataset.k, rec=klon(al(k,{}))||{}; rec.kapali=true; rec.tarih=ymd(bugun()); koy(k,rec,{sessiz:true}); bildiri('Aylık oturum kapandı.'); location.hash='#/bugun'; };
V.gecis=r=>rehberMod()?gecisRehber(r):gecisAyrintili(r);
function gecisRehber(r){
  const p=PID[r.a]; if(!p) return {baslik:'Geçiş',geri:1,html:''};
  const st=program(p.id), i0=PROG.indexOf(p), onceki=i0>0?PROG[i0-1].gecis:0, sonraki=PROG[i0+1], tuttu=st.gecisSonuc==='tuttu';
  const yeni=[...HAFTALIK,...AYLIK].filter(x=>x.bas>onceki&&x.bas<=p.gecis);
  const A=[`<p class="ust-yazi">${esc(p.ad)} · ${uzunluk(p)} gün bitti</p><h2 class="bas is">Varış ölçütü tuttu mu?</h2>${testTekrar(p)}<p>${md(DOC[p.id].cikis)}</p><p class="aciklama">Dürüstçe. Tutmadıysa ceza yok: program iki hafta uzar, takvim kayar.</p>${tuttu?'<p class="el">Tuttu ✓</p>':`<div class="sira"><button class="dugme dolu" data-is="gecisKarar" data-p="${p.id}" data-v="tuttu">Tuttu</button><button class="dugme kirmizi" data-is="gecisKarar" data-p="${p.id}" data-v="tutmadi">Tutmadı, iki hafta uzat</button></div>`}`,
   `<h2 class="bas is">Ne yerleşti?</h2><p class="aciklama">Programın maddelerini ayır. Yerleşenin günlük sayımı bu hafta bitiyor; yapılmaya devam eder, sayılmaz.</p>${MADDELER.filter(m=>m.pid===p.id).map(maddeSatiri).join('')}`,
   `<h2 class="bas is">Artık devrede</h2>${yeni.length?`<p class="aciklama">Son geçişten beri okuduğun metinlerin ritmik pratikleri:</p>${yeni.map(x=>`<a class="cip" href="${bolum(x.k[0],x.k[1])}">${esc(x.ad)}</a>`).join('')}`:'<p class="aciklama">Bu aralıkta yeni ritmik pratik yok.</p>'}`,
   sonraki?`<h2 class="bas is">Sıradaki: ${esc(sonraki.ad)}</h2><p>Kısım 5'ini ve ilk gün bölümünü oku. Birkaç programsız gün dinlen; hazır olunca Bugün ekranından başlat.</p><div class="sira">${dugme('İlk gün',bolum(sonraki.id,sonraki.ilk),'ince')}${dugme('Kısım 5',bolum(sonraki.id,'5.1'),'ince')}</div>`:`<h2 class="bas is">Sıradaki: mezuniyet</h2><p>Kırk sekiz haftanın sonu yaklaşıyor.</p>`];
  const i=tuttu?Math.max(0,Math.min(3,+r.b||0)):0;
  return adimSayfa({baslik:'Geçiş',alt:p.ad,i,n:4,ic:A[i],geriH:i>0?`#/gecis/${p.id}/${i-1}`:'',
    ileri:i===0?(tuttu?{etiket:'Devam',h:`#/gecis/${p.id}/1`}:null):i<3?{etiket:'Devam',h:`#/gecis/${p.id}/${i+1}`}:{etiket:'Geçişi tamamla',is:'gecisBitir',data:`data-p="${p.id}"`}}); }
IS.gecisKarar=t=>{ IS.gecisSonuc(t); if(t.dataset.v==='tuttu') location.hash=`#/gecis/${t.dataset.p}/1`; };
function sonPanelRehber(d){ const m=metin(d.id);
  if(!m.okundu) return `<div class="son-panel"><h2 style="margin-top:0">Bitirdin mi?</h2><p>${d.tur==='plan'?'Okuduğunda işaretle.':'Okudum de; sonra üç kısa soru, yukarı bakmadan.'}</p><button class="dugme dolu genis" data-is="okudum" data-id="${d.id}">Okudum</button></div>`;
  if(d.tur==='plan') return `<div class="son-panel"><p class="el">Okundu ✓</p></div>`;
  const tam=kayitli(d.id), x=hatirlaSay(d);
  return `<div class="son-panel"><h2 style="margin-top:0">${tam?'Metin kaydın':'Kaydı yaz'}</h2>${tam?`<p><strong>Ana iddia:</strong> ${esc(m.m1)}</p><p><strong>Rahatsız eden fikir:</strong> ${esc(m.m2)}</p><p><strong>Bu hafta tek değişiklik:</strong> ${esc(m.m3)}</p>`:'<p>Üç kısa soru, yukarı bakmadan. Hatırlayabildiğin kadarı, öğrendiğin kadar.</p>'}<a class="dugme ${tam?'':'dolu'} genis" href="#/kayit/${d.id}/0">${tam?'Kaydı düzenle':'Kaydı yaz'}</a>${(d.hatirla||[]).length?`<p class="ipucu">Kapat ve hatırla: ${x.n}/${x.m} soru. <a class="ref" href="#/hatirla/${d.id}">Kapalı kitapla aç</a></p>`:''}</div>`; }
V.kayit=r=>{ const d=DOC[r.a]; if(!d) return {baslik:'Bulunamadı',geri:1,html:blok('','<p>Bu metin yok.</p>')};
  const i=Math.max(0,Math.min(3,+r.b||0)), k='metin:'+d.id, m=metin(d.id);
  const Q=[['m1','Ana iddia ne?','Metnin tek cümlelik özü. Yukarı bakmadan.'],['m2','En rahatsız edici fikir ne?','Seni en çok dürten ya da itiraz ettiren fikir.'],['m3','Bu hafta tek değişiklik ne?','Somut ve küçük: ne, ne zaman.'],['bag','Önceki bir metinle bağlantısı var mı?','İsteğe bağlı. Yoksa boş bırak.']], [y,sr,ac]=Q[i];
  return adimSayfa({baslik:'Metin kaydı',alt:docAd(d.id),i,n:4,ic:`<h2 class="bas is">${sr}</h2><p class="aciklama">${ac}</p><textarea class="yazi" rows="3" data-rk="${k}" data-yol="${y}" data-yazi aria-label="${esc(sr)}">${esc(m[y]||'')}</textarea>`,geriH:i>0?`#/kayit/${d.id}/${i-1}`:'',
    ileri:i<3?{etiket:'Devam',h:`#/kayit/${d.id}/${i+1}`,sart:`${k}|${y}`}:{etiket:'Kaydet',h:'#/bugun',mesaj:'Kayıt tamam. Tekrar takvimi başladı.'}}); };

/* ================= BUGÜN: REHBER ================= */
V.bugun=()=>rehberMod()?bugunRehber():bugunAyrintili();
function yaziBosalt(){ $$('[data-yazi]').forEach(e=>{ if(e._z){ clearTimeout(e._z); e._z=null; if(e._k) e._k(); } }); }
const noktalar=(i,n)=>`<div class="noktalar${n>8?' cok':''}" aria-hidden="true">${Array.from({length:n},(_,j)=>`<i class="${j<=i?'dolu':''}"></i>`).join('')}</div>`;
function bugunRehber(){
  if(!baslangic()) return {baslik:'Defter',alt:'Hoş geldin',html:hosgeldin()};
  const s=simdi(), b=bugun(); if(s.tip==='once'||s.tip==='kesinti') return bugunAyrintili();
  const h=[];
  if(s.w===0) h.push(hazirlikKart());
  else { const p=aktifProgram(); if(p) h.push(programKart(p)); else { const n=siradaki(); if(n) h.push(siradakiKart(n,s)); } }
  const is=gunIsleri(s);
  if(is.length){ h.push(is.slice(0,2).map(isKart).join('')); if(is.length>2) h.push(blok('',`<details class="rehber"><summary>Diğer işler (${is.length-2})</summary>${is.slice(2).map(isSatir).join('')}</details>`)); }
  const mz=al('mezuniyet',{}); if(!mz.tarih&&(PROG.every(p=>program(p.id).durum==='tamam')||aktifAy()>=11)) h.push(blok('Varış',`<h2 class="bas">Mezuniyet zamanı</h2><p>Kırk sekiz haftanın sonu. İki oturum: bak ve bırak.</p><a class="dugme dolu genis" href="#/mezuniyet">Mezuniyete başla</a>`));
  return {baslik:s.w===0?'Hafta 0: Hazırlık':`Hafta ${s.w}${s.tip==='uzatma'?' · uzatma':''}`,alt:`${gunAdi(b)}, ${uzun(b)}`,html:h.join('')};
}
function hazirlikKart(){
  const ad=dizi(al('hazirlik',{}).adim), i=S.hazirlik.findIndex((_,j)=>!ad[j]), L=[['#/oku/plan','Planı aç'],['#/oku/disiplin','Disiplin metnini aç'],['#/baslangic','Beş soruyu aç'],[bolum('disiplin','5.9'),'Disiplin 5.9'],['','']];
  if(i<0) return blok('<b>5</b>/5',`<p class="ust-yazi">Hazırlık tamam</p><h2 class="bas is">Hafta 1 başlıyor: ${uzun(baslangic())}</h2><p>Bugün yapılacak başka bir şey yok.</p>`);
  const x=S.hazirlik[i];
  return blok(`<b>${i+1}</b>/5`,`<p class="ust-yazi">Hazırlık · adım ${i+1} / 5 · ${esc(x.gun)}</p><p class="is-metin">${md(x.metin)}</p>${L[i][0]?`<div class="sira" style="margin-top:.2rem">${dugme(L[i][1],L[i][0],'ince')}</div>`:''}<button class="dugme dolu genis" data-is="hazirlikAdim" data-i="${i}">Yaptım</button><p class="ipucu">Hazırlık bir hafta. Yedinci gün eksik olsa da Hafta 1 başlıyor.</p>`);
}
IS.hazirlikAdim=t=>{ const rec=klon(al('hazirlik',{}))||{}, a=dizi(rec.adim); a[+t.dataset.i]=true; rec.adim=a; koy('hazirlik',rec); };
function gunRehberi(p,n){
  const g=gunKaydi(p.id,n), y=yonerge(p,n), gc=g.c||{}, fz=al('faz:'+p.id,{}), il=al('ilk:'+p.id,{}), yil=Y[p.id], D0=DOC[p.id], f=fazBul(p,n);
  const kutu=(at,ch,ic,ek='')=>`<label class="onay"><input type="checkbox" ${at} ${ch?'checked':''}><span class="kutu"></span><span>${ic}${ek?`<small>${esc(ek)}</small>`:''}</span></label>`;
  let r='';
  if(yil&&n<=3&&!yil.ilk.every((_,i)=>il['k'+i])) r+=`<h3 class="bas">İlk gün</h3>${yil.ilk.map((x,i)=>kutu(`data-rk="ilk:${p.id}" data-yol="k${i}"`,il['k'+i],baglantili(D0,x))).join('')}`;
  if(y&&y.gunluk.length) r+=`<h3 class="bas">Bugünün adımları</h3><p class="aciklama" style="margin-top:0">Hepsini işaretlersen gün kendiliğinden tamamlanır.</p>${y.gunluk.map(x=>kutu(`data-deg="gunMadde" data-p="${p.id}" data-n="${n}" data-k="${x.k}"`,gc[x.k],baglantili(D0,x.m),/^(Her gün|Günlük)$/.test(x.e)?'':x.e)).join('')}`;
  if(y&&y.pazar.length) r+=`<h3 class="bas">Bugün pazar</h3>${y.pazar.map(x=>kutu(`data-deg="gunMadde" data-p="${p.id}" data-n="${n}" data-k="${x.k}"`,gc[x.k],baglantili(D0,x.m))).join('')}`;
  if(y&&y.isler.length){ const yap=y.isler.filter(x=>fz[x.k]).length; r+=`<h3 class="bas">Bu aşamanın işleri <span class="aciklama">${yap}/${y.isler.length}</span></h3>${y.isler.map(x=>kutu(`data-rk="faz:${p.id}" data-yol="${x.k}"`,fz[x.k],baglantili(D0,x.m),x.e==='Bu hafta'?'':x.e)).join('')}`; }
  if(y&&(y.beklenir||y.beklenmez)) r+=`${y.beklenir?`<p><strong>Ne beklenir:</strong> ${md(y.beklenir)}</p>`:''}${y.beklenmez?`<p><strong>Ne beklenmez:</strong> ${md(y.beklenmez)}</p>`:''}`;
  if(p.id==='disiplin') r=projeSatir()+r;
  return r+`<div class="sira"><a class="cip" href="${bolum(p.id,f[3])}">${esc(f[2])} bölümü</a><a class="cip" href="${bolum(p.id,p.asgari)}">Zor gün sürümü</a><a class="cip" href="${bolum(p.id,p.olcum)}">Ölçüm</a><a class="cip" href="#/basla/${p.id}/1">Planını düzenle</a></div>`;
}
function olcuAlanlari(p,n,g){ const m=p.metrik, k=`gun:${p.id}:${n}`;
  const a=m.tip==='evet'?`<label class="onay"><input type="checkbox" data-rk="${k}" data-yol="m" ${g.m?'checked':''}><span class="kutu"></span><span>${esc(m.ad)}</span></label>`
   :`<label class="alan" for="mt">${esc(m.ad)}${m.birim?' ('+m.birim+')':''}</label><input class="yazi" id="mt" type="number" inputmode="numeric" min="0" data-rk="${k}" data-yol="m" data-yazi value="${g.m==null?'':g.m}">`;
  return `<div class="olcu"><p class="aciklama" style="margin:.7rem 0 0">Günün ölçüsü</p>${a}${(p.ekler||[]).map((x,i)=>`<label class="alan" for="ek${i}">${esc(x.ad)}${x.birim?' ('+x.birim+')':''}</label><input class="yazi" id="ek${i}" type="number" inputmode="numeric" min="0" data-rk="${k}" data-yol="${x.alan}" data-yazi value="${g[x.alan]==null?'':g[x.alan]}">`).join('')}</div>`; }
const aracBaglanti=p=>(p.id==='bitirme'?projeSatir():'')+(p.id==='para'?paraSatir():'')+(p.id==='ustalasma'?ustalikSatir():'')+(p.id==='dikkat'?dikkatSatir():'')+(p.id==='duygu'?`<div class="sira" style="margin-top:.4rem"><a class="cip" href="#/arac/duygu/yeni">Tetiklendiysen satır ekle</a></div>`:'');
function programKart(p){
  const n=programGunu(p), L=uzunluk(p);
  if(n>L) return blok(`<b>${L}</b>/${L}`,`<p class="ust-yazi">${esc(p.ad)} · ${L} gün tamam</p><h2 class="bas is">Şimdi tek soru: varış ölçütü tuttu mu?</h2><p class="aciklama">Geçiş haftası bunu adım adım soruyor.</p><a class="dugme dolu genis" href="#/gecis/${p.id}">Geçişe başla</a>`);
  const g=gunKaydi(p.id,n), z=zincir(), ni=al('niyet:'+p.id,{})||{}, zor=String(ni.zor||p.zor||'').trim();
  const niyet=ni.zaman?`<p class="niyet">${esc(ni.zaman)}</p>`:`<p class="aciklama"><a class="ref" href="#/basla/${p.id}/1">Ne zaman ve nerede yapacağını yaz</a></p>`;
  const govde=!g.x?`<button class="dugme dolu genis" data-is="yaptim" data-p="${p.id}" data-n="${n}">Yaptım</button>${zor?`<button class="dugme genis" data-is="yaptim" data-p="${p.id}" data-n="${n}" data-asgari="1">Zor gün: ${esc(zor)}</button>`:''}`
    :`<p class="tamam">${g.asgari?'Zor gün sürümü yapıldı; zincir sürüyor.':'Bugün tamam.'}<button class="dugme ince" data-is="gerial" data-p="${p.id}" data-n="${n}">Geri al</button></p>${olcuAlanlari(p,n,g)}`;
  return blok(`<b>${n}</b>/${L}`,`<p class="ust-yazi">${esc(p.ad)} · gün ${n} / ${L}${program(p.id).uzatma?' · uzatma':''}</p><p class="aciklama" style="margin:0">Bugünün işi</p><h2 class="bas is">${esc(p.gorev)}</h2>${niyet}${govde}${aracBaglanti(p)}
<details class="rehber nasil"><summary>Nasıl yapılır?</summary>${gunRehberi(p,n)}</details>
<p class="ipucu">Zincir ${z.simdi} gün.${z.dunKacti?' <strong>Dün kaçtı; bugün de kaçarsa zincir kopar.</strong>':' Bir kaçırma zinciri koparmaz.'}</p>`);
}
IS.yaptim=t=>{ const p=t.dataset.p, n=+t.dataset.n, g=klon(gunKaydi(p,n))||{}; g.x=true; if(t.dataset.asgari) g.asgari=true; else delete g.asgari; g.tarih=ymd(bugun()); koy(`gun:${p}:${n}`,g); };
IS.gerial=t=>{ const p=t.dataset.p, n=+t.dataset.n, g=klon(gunKaydi(p,n))||{}; g.x=false; delete g.asgari; koy(`gun:${p}:${n}`,g); };
function siradakiKart(p,s){ const erken=s.w<p.bas, onceki=PROG[PROG.indexOf(p)-1]; if(onceki&&program(onceki.id).durum!=='tamam') return '';
  return blok('Sırada',`<p class="ust-yazi">Sıradaki program${erken?` · takvimde ${p.bas-s.w} hafta sonra`:''}</p><h2 class="bas is">${esc(p.ad)}</h2><p>${uzunluk(p)} gün. Her gün tek iş: ${esc(p.gorev.toLocaleLowerCase('tr'))}.</p><a class="dugme dolu genis" href="#/basla/${p.id}/0">Başla</a>${erken?'<p class="ipucu">Takvimden önce başlamak serbest; plan yalnızca aynı anda tek program ister.</p>':''}`); }
V.basla=r=>{ const p=PID[r.a]; if(!p) return {baslik:'Bulunamadı',geri:1,html:blok('','<p>Böyle bir program yok.</p>')};
  const i=Math.max(0,Math.min(2,+r.b||0)), aktif=program(p.id).durum==='aktif', k='niyet:'+p.id, ni=al(k,{})||{}, d=DOC[p.id];
  const A=[`<p class="ust-yazi">${uzunluk(p)} gün</p><h2 class="bas is">${esc(p.ad)}</h2><p>Her gün tek iş: ${esc(p.gorev.toLocaleLowerCase('tr'))}.</p><p><strong>Varış:</strong> ${md(d.cikis.replace(/ Tutmadıysa.*$/,''))}</p><div class="sira">${dugme('Metni oku','#/oku/'+p.id,'ince')}${dugme('İlk gün bölümü',bolum(p.id,p.ilk),'ince')}</div>`,
   `<h2 class="bas is">Ne zaman ve nerede yapacaksın?</h2><p class="aciklama">Tek cümle, somut: "Her sabah 07.30'da, masada, kahveden sonra" gibi. Önceden yazılan bu cümle, işin gerçekten yapılma olasılığını belirgin biçimde artırıyor.</p><label class="alan" for="nz">Ne zaman, nerede</label><textarea class="yazi" id="nz" rows="2" data-rk="${k}" data-yol="zaman" data-yazi>${esc(ni.zaman||'')}</textarea><label class="alan" for="ng">Engel çıkarsa ne yapacaksın? (isteğe bağlı)</label><textarea class="yazi" id="ng" rows="2" data-rk="${k}" data-yol="engel" data-yazi>${esc(ni.engel||'')}</textarea>`,
   `<h2 class="bas is">Zor gün sürümün</h2><p class="aciklama">Metin bunu bugün yazmanı istiyor: kötü gün geldiğinde karar verecek durumda olmayacaksın. O gün bunu yapmak zinciri korur.</p><label class="alan" for="nk">Zor günde yapacağım</label><textarea class="yazi" id="nk" rows="2" data-rk="${k}" data-yol="zor" data-yazi>${esc(ni.zor||p.zor||'')}</textarea><p class="ipucu">${esc(docAd(p.id))} ${p.asgari}'den. İstersen değiştir.</p>`];
  return adimSayfa({baslik:aktif?'Planını düzenle':'Başlangıç',alt:p.ad,i,n:3,ic:A[i],geriH:i>0?`#/basla/${p.id}/${i-1}`:'',
    ileri:i<2?{etiket:'Devam',is:'adimIleri',data:`data-p="${p.id}" data-i="${i}"`}:aktif?{etiket:'Kaydet',is:'planKaydet',data:`data-p="${p.id}"`}:{etiket:'Programı başlat',is:'baslaBitir',data:`data-p="${p.id}"`}}); };
IS.adimIleri=t=>{ yaziBosalt(); const id=t.dataset.p, i=+t.dataset.i;
  if(i===1&&!String((al('niyet:'+id,{})||{}).zaman||'').trim()){ bildiri('Tek cümle yeter; sonra değiştirebilirsin.'); const e=$('#nz'); if(e) e.focus(); return; }
  location.hash=`#/basla/${id}/${i+1}`; };
const zorVarsayilan=id=>{ yaziBosalt(); const k='niyet:'+id, rec=klon(al(k,{}))||{}; if(!String(rec.zor||'').trim()){ rec.zor=PID[id].zor; koy(k,rec,{sessiz:true}); } };
IS.planKaydet=t=>{ zorVarsayilan(t.dataset.p); location.hash='#/bugun'; };
IS.baslaBitir=t=>{ const id=t.dataset.p; zorVarsayilan(id); if(aktifProgram()){ bildiri('Önce aktif programı bitir: aynı anda tek program.'); return; }
  koy('program:'+id,Object.assign(klon(program(id)),{durum:'aktif',bas:ymd(bugun()),uzatma:program(id).uzatma||0}),{sessiz:true}); bildiri(PID[id].ad+' başladı.'); location.hash='#/bugun'; };
function gunIsleri(s){ const b=bugun(), gd=b.getDay(), o=[];
  const pk='pazar:'+ymd(pazartesi(b)); if((gd===0||gd===6)&&s.w>=1&&!(al(pk)||{}).kapali) o.push({s:1,b:'Pazar gözden geçirmesi',a:'Üç soru, yirmi dakika.',h:'#/pazar',d:'Başla'});
  const ip=(()=>{ const x=new Date(b.getFullYear(),b.getMonth(),1); while(x.getDay()!==0) x.setDate(x.getDate()+1); return x; })();
  if(s.w>=1&&b>=ip&&!(al('aylik:'+ymd(b).slice(0,7))||{}).kapali) o.push({s:2,b:'Aylık oturum',a:'Yerleşen alışkanlıklar ve beş soru.',h:'#/aylik',d:'Başla'});
  incelemeler().forEach(x=>{ const ht=x.a==='g1'&&(DOC[x.id].hatirla||[]).length; o.push({s:x.a==='g1'?3:8,b:docAd(x.id),a:x.t,h:ht?'#/hatirla/'+x.id:null,d:ht?'Soruları aç':null,inc:x}); });
  const ow=okumaHaftasi(); if(ow>=0){ const r=OKUMA.find(x=>!x.raf&&x.w<=ow&&!okundu(x.id)); if(r) o.push({s:4,b:'Okuma: '+docAd(r.id),a:`Yaklaşık ${Math.round(DOC[r.id].kelime/220)} dakika. Okuyunca üç madde yaz.`,h:'#/oku/'+r.id,d:'Oku'}); }
  if(ARAC.karar.acik()) kayitlar('karar').filter(({v})=>v.tarih2&&tarih(v.tarih2)<=b&&!v.sonuc).forEach(({k,v})=>o.push({s:5,b:'Karar: '+(v.karar||'adsız'),a:'Değerlendirme günü geldi: beklediğin ne oldu?',is:'kayitAc',data:`data-a="karar" data-k="${k}"`,d:'Değerlendir'}));
  if(ARAC.ogrenme.acik()) kayitlar('ogrenme').forEach(({k,v})=>{ const t=sonrakiTekrar(v); if(t&&t.gecti) o.push({s:5,b:'Tekrar: '+(v.konu||'adsız konu'),a:`${t.i}. tekrar: kapalı kitapla hatırla, sonra kontrol et.`,is:'tekrarYap',data:`data-k="${k}" data-i="${t.i}"`,d:'Yaptım'}); });
  if(ARAC.para.acik()) kayitlar('bekleme').filter(({v})=>v.durum==='bekliyor'&&beklemeBitis(v)<=b).forEach(({k,v})=>o.push({s:6,b:'Bekleme doldu: '+v.ne,a:'Hâlâ istiyor musun?',bekle:k}));
  SEYREK.filter(x=>x.h.includes(s.w)&&!al(`seyrek:${x.id}:${s.w}`)).forEach(x=>o.push({s:6,b:x.ad,a:`${docAd(x.k[0])} ${x.k[1]}`,h:bolum(x.k[0],x.k[1]),d:'Nasıl?',is:'seyrekYap',data:`data-k="seyrek:${x.id}:${s.w}"`,d2:'Yaptım'}));
  if(yedekGerekli()){ const g=yedekGun(); o.push({s:9,b:'Yedek',a:`${g==null?'Henüz yedek alınmadı.':`Son yedek ${g} gün önce.`} Kayıtların tek kopyası bu cihazda.`,is:'disari',d:'Yedeği indir'}); }
  return o.sort((x,y)=>x.s-y.s); }
IS.seyrekYap=t=>koy(t.dataset.k,true);
function isEylem(x){
  if(x.inc&&x.inc.a!=='g1') return `<button class="dugme" data-is="incele" data-id="${x.inc.id}" data-a="${x.inc.a}" data-v="1">Evet</button><button class="dugme" data-is="incele" data-id="${x.inc.id}" data-a="${x.inc.a}" data-v="0">Hayır</button>`;
  if(x.bekle) return `<button class="dugme" data-is="beklemeSonuc" data-k="${x.bekle}" data-v="aldim">İstiyorum, aldım</button><button class="dugme" data-is="beklemeSonuc" data-k="${x.bekle}" data-v="vazgectim">Vazgeçtim</button>`;
  let h=x.h?`<a class="dugme dolu" href="${x.h}">${esc(x.d||'Aç')}</a>`:'';
  if(x.is) h+=`<button class="dugme ${x.h?'':'dolu'}" data-is="${x.is}" ${x.data||''}>${esc(x.d2||x.d)}</button>`;
  if(x.inc&&x.inc.a==='g1') h+=`<button class="dugme" data-is="incele" data-id="${x.inc.id}" data-a="g1" data-v="1">Yaptım</button>`;
  return h; }
const isKart=x=>blok('Sırada',`<h2 class="bas">${esc(x.b)}</h2><p class="aciklama" style="margin-top:.1rem">${esc(x.a)}</p><div class="sira">${isEylem(x)}</div>`);
const isSatir=x=>`<div class="is-satir"><strong>${esc(x.b)}</strong><br><span class="aciklama">${esc(x.a)}</span><div class="sira" style="margin-top:.35rem">${isEylem(x)}</div></div>`;
V.daha=()=>({baslik:'Daha fazla',html:blok('',`<ul class="liste">${[
 ['#/defter','Kayıtlarım','Günlük, metin kayıtları, testler ve yazdıkların.'],
 ['#/defter/e','Araçlar','Programların istediği tablolar ve formlar. Gerektiğinde Bugün ekranı kendisi açar.'],
 ['#/muhurler','Dönüm noktaları','Varış kayıtları ve sıradaki.'],
 ['#/kart','Zor anlar kartı','Bir durum gelince ne yapılacağı: öfkeli mesaj, zor konuşma, kayıp.'],
 ['#/kayitokuma','Yıllık kayıt okuması','Bütün kayıtlar yan yana, üç soru.'],
 ['#/kesinti','Ara ver','Hastalık ya da yoğun dönem: takvimi durdur, sonra dön.'],
 ['#/ayarlar','Ayarlar','Takvim, görünüm, yedek ve senkron.']].map(([h,t,a])=>`<li><a class="satir daha-satir" href="${h}"><span></span><span><strong>${t}</strong><br><span class="aciklama">${a}</span></span><span class="durum" aria-hidden="true">›</span></a></li>`).join('')}</ul>`)});
IS.gorunum=t=>koy('ayar:gorunum',t.dataset.v);

/* ================= YOL ================= */
let secili=null;
IS.hucre=t=>{ secili=+t.dataset.w; ciz(true); };
const yolAyrintili=()=>{
  if(!baslangic()) return {baslik:'Yol',html:kurulum()};
  const s=simdi(), cur=s.tip==='once'?-1:s.w, st=istatistik(), ilk=PROG.reduce((o,p)=>(o[p.bas]=p,o),{});
  if(secili==null) secili=Math.max(0,Math.min(48,cur));
  const hucre=w=>{ const r=S.hafta[w]||{}, f=fazOf(w), p=ilk[w];
    return `<button class="hucre ${f?'faz'+f.no:''} ${r.program==='gecis'?'gecis':''} ${w<cur?'gecmis':''} ${w===cur?'simdi':''}" data-is="hucre" data-w="${w}" aria-pressed="${w===secili}" aria-label="Hafta ${w}"><span class="n">${w}</span>${p?`<span class="h">${p.kod}</span>`:''}</button>`; };
  const r=S.hafta[secili], hb=haftaBas(secili);
  const detay=secili===0?`<strong>Hafta 0 — Hazırlık.</strong> Plan ve disiplin metni, defter, beş soru.`
   :`<strong>Hafta ${secili}${hb?' — '+kisa(hb)+' haftası':''}</strong><br>${esc(r.etiket)}${r.oku.length?`<br>Okuma: ${r.oku.map(id=>`<a href="#/oku/${id}">${esc(docAd(id))}</a>`).join(', ')}`:''}${r.not.length?`<ul style="margin:.3rem 0 0;padding-left:1.1rem">${r.not.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}`;
  const mez=haftaBas(48), mzt=mez?ekle(mez,7):null;
  const fazlar=FAZLAR.map(f=>`<h3 class="bas">Faz ${['I','II','III','IV'][f.no-1]}: ${esc(f.ad)} <span class="aciklama">Hafta ${f.a}-${f.b}</span></h3>${f.p.map(id=>{ const p=PID[id], x=program(id);
    const d=x.durum==='tamam'?`<span class="el">tamam</span> ${x.bitis?kisa(tarih(x.bitis)):''}`:x.durum==='aktif'?`gün ${Math.min(programGunu(p),uzunluk(p))}/${uzunluk(p)}`:`Hafta ${p.bas}`;
    return `<p style="margin:.2rem 0"><a href="#/oku/${id}">${esc(p.ad)}</a> — ${d}${x.uzatma?`, uzatma ${x.uzatma}`:''}</p>`; }).join('')}`).join('');
  return {baslik:'Yol',alt:mzt?`Mezuniyet: ${uzun(mzt)}`:'',html:
   blok('İlerleme',`<p style="margin:0">Programlar ${st.tamam.length}/8</p>${kareler(st.tamam.length,8)}
<p style="margin:.5rem 0 0">Metinler ${st.kayit}/23</p>${kareler(st.kayit,23)}
<p style="margin:.5rem 0 0">C bölümü ${st.c}, ölçüt altı</p>${kareler(Math.min(st.c,12),12)}`)
  +blok('49 hafta',`<div class="yol">${Array.from({length:49},(_,w)=>hucre(w)).join('')}</div>
<div class="lejant"><span>✕ geçen hafta</span><span>kırmızı çerçeve: bu hafta</span><span>çizgili: geçiş</span><span>kod: program başlangıcı</span></div>
<div class="sonuc" style="margin-top:.8rem">${detay}</div>`)
  +blok('Fazlar',fazlar+`<div class="sira">${dugme('Kesinti','#/kesinti','ince')}</div>`)};
};

/* ================= KİTAPLIK ================= */
function durumYazi(id){ const m=metin(id), t=testler(id).length;
  if(!m.okundu) return OKW[id]!=null?`Hafta ${OKW[id]}`:''; return `<span class="el">${kayitli(id)?'✓ kayıt':'okundu'}</span>${t?', test':''}`; }
V.kitaplik=()=>{
  const grup=(ad,f)=>blok(ad,`<ul class="liste">${S.docs.filter(f).map(d=>`<li><a class="satir" href="#/oku/${d.id}"><span class="no">${d.no||(d.id==='takvim'?'T':'0')}</span><span>${esc(d.baslik)}</span><span class="durum">${durumYazi(d.id)}</span></a></li>`).join('')}</ul>`);
  const son=al('ayar:son'); const sm=son&&metin(son);
  return {baslik:'Kitaplık',alt:`${METINLER.filter(okundu).length}/23 okundu`,html:
    (rehberMod()?siradakiOkuma():'')+(son?blok('Kaldığın yer',`<a class="dugme" href="#/oku/${son}/${sm&&sm.son?sm.son:''}">${esc(docAd(son))}${sm&&sm.son?', bölüm '+sm.son.slice(2).replace('-','.'):''}</a>`):'')
    +grup('Plan',d=>d.tur==='plan')+grup('Program',d=>d.tur==='program')+grup('Kavram',d=>d.tur==='kavram')+grup('Durum',d=>d.tur==='durum')};
};

/* ================= OKU ================= */
let gozcu=null;
function sonPanel(d){
  if(rehberMod()) return sonPanelRehber(d);
  const m=metin(d.id), bil=[];
  if(d.tur==='program'){ const p=PID[d.id], x=program(d.id); bil.push(`<p><strong>Çıkış ölçütü:</strong> ${md(d.cikis)}</p><p class="aciklama">Program ${x.durum==='tamam'?'tamam':x.durum==='aktif'?'aktif':'takvimde Hafta '+p.bas}.</p>`); }
  if(d.tur==='kavram'&&d.pratik.length) bil.push(`<p><strong>Arka plana:</strong></p>${d.pratik.map(x=>`<p class="el">${esc(x)}</p>`).join('')}`);
  if(d.tur==='durum') bil.push(`<p class="aciklama">Durum metni: ihtiyaç anında açılır. Kart, onu gerektiren durumu gösteriyor.</p>`);
  if(!m.okundu&&d.tur!=='plan') return `<div class="son-panel"><h2 style="margin-top:0">Okudun mu?</h2><p>Okuduğunda işaretle; üç maddelik kayıt ve tekrar takvimi açılır.</p><div class="sira"><button class="dugme dolu" data-is="okudum" data-id="${d.id}">Okudum</button></div>${bil.join('')}</div>`;
  if(d.tur==='plan'&&!m.okundu) return `<div class="son-panel"><div class="sira"><button class="dugme dolu" data-is="okudum" data-id="${d.id}">Okudum</button></div></div>`;
  const o=tarih(m.okundu), tk=[['g1','Ertesi gün',1],['h1','Bir hafta sonra',7],['a1','Bir ay sonra',30]];
  return `<div class="son-panel"><h2 style="margin-top:0">Metin kaydı</h2><p class="aciklama">${uzun(o)} okundu. Yukarı bakmadan yaz.</p>
${[['m1','Ana iddia'],['m2','En rahatsız edici fikir'],['m3','Bu hafta tek değişiklik'],['bag','Önceki bir metinle bağlantı']].map(([k,t])=>`<label class="alan" for="${k}">${t}</label><textarea class="yazi" id="${k}" rows="2" data-rk="metin:${d.id}" data-yol="${k}" data-yazi>${esc(m[k]||'')}</textarea>`).join('')}
<p style="margin-top:1rem"><strong>Tekrar takvimi</strong></p>${tk.map(([k,t,n])=>`<p style="margin:.15rem 0">${t} — ${kisa(ekle(o,n))} ${m[k]?`<span class="el">✓</span>${m[k+'v']===false?' (hayır)':''}`:''}</p>`).join('')}${(d.hatirla||[]).length?(()=>{ const x=hatirlaSay(d); return `<p style="margin-top:1rem"><strong>Kapat ve hatırla:</strong> ${x.n}/${x.m} soru cevaplandı. <a class="ref" href="#/hatirla/${d.id}">Kapalı kitapla aç</a></p>`; })():''}${bil.join('')}</div>`;
}
function testCta(d){ const t=d.test; if(!t) return ''; const a=testler(d.id), son=a[a.length-1];
  let oz=''; if(son&&t.tip==='test'){ const say=sayim(t,son.sec); oz=`<span class="aciklama"> Son sonuç ${kisa(tarih(son.tarih))}: ${t.gruplar.map((g,i)=>g.harf+' '+say[i]).join(', ')}</span>`; }
  return `<a class="dugme" href="#/test/${d.id}">${t.tip==='test'?(a.length?'Testi tekrar çöz':'Testi çöz'):'Neredesin?'}</a>${oz}`; }
function okuGuncelle(r){ const d=DOC[r.a]; if(!d) return; const sp=$('.son-panel'); if(sp&&!yaziyor()) sp.outerHTML=sonPanel(d); const tc=$('.test-cta'); if(tc) tc.innerHTML=testCta(d); nokta(); }
IS.okudum=t=>{ const id=t.dataset.id, m=klon(metin(id)); if(!m.okundu) m.okundu=ymd(bugun()); koy('metin:'+id,m); if(rehberMod()&&DOC[id].tur!=='plan'){ location.hash='#/kayit/'+id+'/0'; return; } bildiri('Okundu olarak işaretlendi. Şimdi üç madde.'); };
IS.bolumler=()=>{ const d=DOC[rota().a]; levha(`<h2>${esc(d.baslik)}</h2><ul class="liste">${d.bolumler.map(b=>`<li><a class="satir" href="#/oku/${d.id}/${b.a}" data-is="git" data-a="${b.a}"><span class="no">${b.no}</span><span>${esc(b.ad)}</span><span></span></a></li>`).join('')}</ul>`); };
IS.git=t=>{ kapatLevha(); const e=document.getElementById(t.dataset.a); if(e){ e.scrollIntoView(); history.replaceState(null,'','#/oku/'+rota().a+'/'+t.dataset.a); } };
V.oku=r=>{
  const d=DOC[r.a]; if(!d) return {baslik:'Bulunamadı',geri:1,html:blok('',`<p>Bu metin yok.</p>`)};
  const m=metin(d.id), tur={plan:'Plan',program:'Program',kavram:'Kavram',durum:'Durum'}[d.tur];
  return {baslik:d.baslik,alt:`${tur} metni${OKW[d.id]!=null?', Hafta '+OKW[d.id]:''}, ${Math.round(d.kelime/220)} dakika`,geri:1,
   html:`<div class="blok" style="padding-bottom:0"><div class="kenar-not">${d.no||''}</div><div class="ic"><div class="sira" style="margin-top:0"><button class="cip" data-is="bolumler">Bölümler</button>${m.son&&!r.b?`<a class="cip" href="#/oku/${d.id}/${m.son}">Kaldığın yer: ${m.son.slice(2).replace('-','.')}</a>`:''}${(d.hatirla||[]).length?`<a class="cip" href="#/hatirla/${d.id}">Kapat ve hatırla</a>`:''}<button class="cip" data-is="yaziBoyut" data-v="-1" aria-label="Yazıyı küçült">A−</button><button class="cip" data-is="yaziBoyut" data-v="1" aria-label="Yazıyı büyüt">A+</button><button class="cip" data-is="yazdir">Yazdır</button></div></div></div>
<article class="okuma" id="metin">${kutuluHtml(d)}${sonPanel(d)}</article>`,
   sonra:(r)=>{ $$('.test-cta').forEach(x=>x.innerHTML=testCta(d)); koy('ayar:son',d.id,{sessiz:true});
     if(r.b){ const e=document.getElementById(r.b); if(e) setTimeout(()=>e.scrollIntoView(),30); }
     if(gozcu) gozcu.disconnect(); let z=null;
     gozcu=new IntersectionObserver(es=>{ const g=es.filter(e=>e.isIntersecting).map(e=>e.target.id)[0]; if(!g) return; clearTimeout(z); z=setTimeout(()=>{ const rec=klon(metin(d.id)); if(rec.son!==g){ rec.son=g; koy('metin:'+d.id,rec,{sessiz:true}); } },1200); },{rootMargin:'-20% 0px -70% 0px'});
     $$('#metin h2[id]').forEach(h=>gozcu.observe(h)); }};
};

/* ================= TEST ================= */
let TD={id:null,sec:[],sonuc:false};
DEG.testsec=t=>{ const v=t.value; TD.sec=t.checked?[...new Set([...TD.sec,v])]:TD.sec.filter(x=>x!==v); const d=DOC[TD.id], say=sayim(d.test,TD.sec);
  $$('.grup-bas .say').forEach((e,i)=>e.textContent=say[i]); if(d.test.tip==='yonlendirme') $$('.yon').forEach((e,i)=>e.hidden=!say[i]); };
function baglantili(d,s){ return md(s).replace(/(?<![\d.,])(\d\.\d+)(?!\d)/g,n=>d.bolumler.some(b=>b.no===n)?`<a class="ref" href="${bolum(d.id,n)}">${n}</a>`:n); }
IS.sonuc=()=>{ TD.sonuc=true; ciz(true); setTimeout(()=>{ const e=$('#sonuc'); if(e) e.scrollIntoView({behavior:'smooth'}); },60); };
IS.testKaydet=()=>{ const a=testler(TD.id).concat([{tarih:ymd(bugun()),sec:TD.sec.slice()}]); koy('test:'+TD.id,a); bildiri('Sonuç kaydedildi.'); };
IS.testYeni=()=>{ TD.sec=[]; TD.sonuc=false; ciz(true); };
V.test=r=>{
  const d=DOC[r.a], t=d&&d.test; if(!t) return {baslik:'Test yok',geri:1,html:''};
  if(TD.id!==d.id){ TD={id:d.id,sec:[],sonuc:false}; }
  const say=sayim(t,TD.sec), gecmis=testler(d.id);
  const gruplar=t.gruplar.map((g,gi)=>`<div class="grup-bas"><span>${esc(g.ad)}</span><span class="say">${say[gi]}</span></div>
${g.maddeler.map((m,mi)=>{ const v=gi+':'+mi, no=t.gruplar.slice(0,gi).reduce((n,x)=>n+x.maddeler.length,0)+mi+1; return `<label class="madde"><span class="mno">${t.tip==='test'?no:''}</span><input type="checkbox" data-deg="testsec" value="${v}" ${TD.sec.includes(v)?'checked':''}><span class="kutu"></span><span>${md(m)}</span></label>`; }).join('')}
${t.tip==='yonlendirme'&&g.yon?`<p class="sonuc yon" ${say[gi]?'':'hidden'}>→ ${baglantili(d,g.yon)}</p>`:''}`).join('');
  let sonuc='';
  if(TD.sonuc&&t.tip==='test'){ const k=kurallar(t,say), onceki=gecmis[gecmis.length-1], os=onceki?sayim(t,onceki.sec):null;
    sonuc=blok('Sonuç',`<div id="sonuc">${k.length?k.map(x=>`<div class="sonuc"><p><strong>${esc(x.etiket)}</strong></p><p>${baglantili(d,x.metin)}</p></div>`).join(''):`<div class="sonuc sessiz"><p>Hiçbir grup eşiği geçmedi: bu metnin sende acil bir konusu yok. Referans olarak tut.</p></div>`}
${t.notlar.map(n=>`<p>${baglantili(d,n)}</p>`).join('')}
${os?`<p style="margin-top:1rem"><strong>Önceki sonuçla</strong> <span class="aciklama">(${kisa(tarih(onceki.tarih))})</span></p><div class="karsilastir">${t.gruplar.map((g,i)=>`<span>${esc(g.ad)}</span><span>${os[i]}</span><span class="el">${say[i]}</span>`).join('')}</div>`:''}
<div class="sira"><button class="dugme dolu" data-is="testKaydet">Sonucu kaydet</button><button class="dugme ince" data-is="testYeni">Temizle</button></div></div>`); }
  return {baslik:t.tip==='test'?'Kendini yerleştir':'Neredesin',alt:d.baslik,geri:1,html:
    blok(t.no,`<p>${md(t.giris||'Sana ait olanları işaretle.')}</p>${gruplar}
${t.tip==='test'?`<div class="sira"><button class="dugme dolu" data-is="sonuc">Sonucu gör</button></div>`:''}`)
   +sonuc
   +(gecmis.length?blok('Geçmiş',gecmis.map(a=>{ const s=sayim(t,a.sec); return `<p style="margin:.2rem 0">${uzun(tarih(a.tarih))} — ${t.gruplar.map((g,i)=>esc(g.harf)+' '+s[i]).join(', ')}</p>`; }).join('')):'')};
};

/* ================= DEFTER ================= */
const uclu=(id,d)=>`<div class="uclu" role="group" aria-label="Durum">${[['yerlesti','Yerleşti'],['suruyor','Sürüyor'],['gitti','Gitti']].map(([v,t])=>`<button data-is="madde" data-id="${id}" data-v="${v}" aria-pressed="${d===v}">${t}</button>`).join('')}</div>`;
IS.madde=t=>{ const k='madde:'+t.dataset.id, rec=klon(al(k,{})); rec.durum=t.dataset.v; rec.tarih=ymd(bugun()); koy(k,rec); };
IS.gun=IS.carpi;
function maddeSatiri(m){ const x=al('madde:'+m.id,{});
  return `<div style="margin:.6rem 0 1rem"><p style="margin:0">${esc(m.ad)}${m.kavram?` <a class="ref" href="${bolum(m.doc,'5.1')}">${esc(docAd(m.doc))}</a>`:''}</p>${uclu(m.id,x.durum)}${x.durum==='gitti'?`<textarea class="yazi" rows="1" placeholder="Neden gitti?" data-rk="madde:${m.id}" data-yol="neden" data-yazi>${esc(x.neden||'')}</textarea>`:''}</div>`; }
function maddeListesi(pids){ return pids.map(pid=>`<h3 class="bas">${esc(PID[pid].ad)}</h3>${MADDELER.filter(m=>m.pid===pid).map(maddeSatiri).join('')}`).join(''); }
function kavramListesi(){ const l=MADDELER.filter(m=>m.kavram&&okundu(m.doc)); return l.length?`<h3 class="bas">Kavram pratikleri</h3>${l.map(maddeSatiri).join('')}`:''; }
V.defter=r=>{
  const sek=r.a||'a', T=[['a','Metin kayıtları'],['b','Program günlüğü'],['c',rehberMod()?'Yerleşenler':'Arka plan'],['d','Değerler'],['e','Araçlar']];
  let h=blok('',`<nav class="sekmeler" aria-label="Defter bölümleri">${T.map(([k,t])=>`<a href="#/defter/${k}"${k===sek?' aria-current="page"':''}>${t}</a>`).join('')}</nav>
<div class="sira" style="margin-top:0">${dugme('Pazar','#/pazar','ince')}${dugme('Aylık oturum','#/aylik','ince')}${dugme('Başlangıç kaydı','#/baslangic','ince')}${dugme('Kesinti','#/kesinti','ince')}</div>`);
  if(sek==='a'){ const l=S.docs.filter(d=>metin(d.id).okundu);
    h+=l.length?l.map(d=>{ const m=metin(d.id); return blok(`<b>${d.no||'0'}</b>${kisa(tarih(m.okundu))}`,`<h3 class="bas" style="margin-top:0"><a href="#/oku/${d.id}">${esc(d.baslik)}</a></h3>
${[['m1','Ana iddia'],['m2','En rahatsız edici fikir'],['m3','Bu hafta tek değişiklik'],['bag','Bağlantı']].map(([k,t])=>`<label class="alan">${t}</label><textarea class="yazi" rows="1" data-rk="metin:${d.id}" data-yol="${k}" data-yazi>${esc(m[k]||'')}</textarea>`).join('')}
<p class="ipucu">Ertesi gün ${m.g1?'✓':'—'}, bir hafta sonra ${m.h1?(m.h1v?'yapıldı':'yapılmadı'):'—'}, bir ay sonra ${m.a1?(m.a1v?'yerleşti':'yerleşmedi'):'—'}.</p>`); }).join('')
     :blok('Boş',`<p>Henüz okunmuş metin yok.</p><div class="sira">${dugme('Kitaplığa git','#/kitaplik','dolu')}</div>`); }
  if(sek==='b'){ const bas=PROG.filter(p=>program(p.id).bas), pid=r.b||(aktifProgram()||bas[bas.length-1]||PROG[0]).id, p=PID[pid], st=program(pid);
    h+=blok('',`<div class="sekmeler">${PROG.map(x=>`<a href="#/defter/b/${x.id}"${x.id===pid?' aria-current="page"':''}>${x.ad}</a>`).join('')}</div>`);
    if(!st.bas) h+=blok(esc(p.ad),`<p>Başlamadı. Takvimde Hafta ${p.bas}.</p>`);
    else { const L=uzunluk(p), cur=Math.min(programGunu(p),L); let x=0, top=0, ev=0;
      for(let n=1;n<=cur;n++){ const g=gunKaydi(pid,n); if(g.x) x++; if(p.metrik.tip==='sayi'&&g.m!=null){ top+=g.m; ev++; } else if(g.m) ev++; }
      h+=blok(`<b>${x}</b>/${cur}`,`<h2 class="bas">${esc(p.ad)}</h2><p class="aciklama">${st.durum==='tamam'?'Tamamlandı':'Gün '+cur+'/'+L}. Geçmiş bir günü işaretlemek için dokun.</p>
<div class="gunler">${Array.from({length:L},(_,i)=>{ const n=i+1, g=gunKaydi(pid,n); return `<button class="gun ${g.x?'x':''} ${n===cur&&st.durum==='aktif'?'bugun':''}" data-is="gun" data-p="${pid}" data-n="${n}" ${n>cur?'disabled':''} aria-label="Gün ${n}" aria-pressed="${!!g.x}"><span>${n}</span></button>`; }).join('')}</div>
<p class="ipucu">${esc(p.metrik.ad)}: ${p.metrik.tip==='sayi'?(ev?`ortalama ${Math.round(top/ev)}${p.metrik.birim?' '+p.metrik.birim:''}`:'henüz yok'):`${ev} gün`}</p>`); } }
  if(sek==='c'){ const pids=PROG.filter(p=>program(p.id).durum!=='bekliyor').map(p=>p.id), st=istatistik();
    const say=d=>MADDELER.filter(m=>(al('madde:'+m.id)||{}).durum===d).length;
    h+=blok(`<b>${st.c}</b>C`,`<h2 class="bas">Arka plan</h2><p>Yerleşti ${st.c}, sürüyor ${say('suruyor')}, gitti ${say('gitti')}. Planın ölçütü altı madde.</p>${kareler(Math.min(st.c,12),12)}
<p class="ipucu">Yerleşen maddenin günlük takibi kalkar; pazar günü yalnızca "duruyor mu?" sorusu kalır.</p>`);
    const kl=kavramListesi(); h+=(pids.length||kl)?blok('',maddeListesi(pids)+kl):blok('',`<p>Arka plan, ilk program başlayınca ya da ilk kavram metni okununca dolmaya başlar.</p>`); }
  if(sek==='d'){ const dg=dizi(al('ayar:degerler',[])), y=al('ayar:yeterince',{});
    h+=blok('Değer',`<h2 class="bas">Beş değer</h2><p class="aciklama">Sıralı. Birinci en önemli. <a href="${bolum('degerler','3.2')}">Değerler 3.2</a></p>
${[0,1,2,3,4].map(i=>`<label class="alan">${i+1}.</label><input class="yazi" data-rk="ayar:degerler" data-dizi="1" data-yol="${i}" data-yazi value="${esc(dg[i]||'')}">`).join('')}`)
     +blok('Yeter',`<h2 class="bas">Beş alanda yeterince</h2><p class="aciklama">"Bu kadarı yeterli; üstü benim değil." <a href="${bolum('yeterince','3.1')}">Yeterince 3.1</a></p>
${YETER.map(([k,t])=>`<label class="alan">${t}</label><textarea class="yazi" rows="1" data-rk="ayar:yeterince" data-yol="${k}" data-yazi>${esc(y[k]||'')}</textarea>`).join('')}`); }
  if(sek==='e') h+=blok('Yıllık',`<p style="margin-top:0">Bütün kayıtlar yan yana, üç soru. <a href="#/kayitokuma">Kayıt okumasını aç</a></p>`)+aracListesi();
  return {baslik:'Defter',alt:{a:'A — metin kayıtları',b:'B — program günlüğü',c:'C — arka plan',d:'Değerler ve tanımlar',e:'Araçlar'}[sek],html:h};
};

/* ================= PAZAR ================= */
IS.duruyor=t=>{ const k=t.dataset.k, rec=klon(al(k,{})); yolKoy(rec,'duruyor.'+t.dataset.id,t.dataset.v==='1'); koy(k,rec); };
IS.degerIsaret=t=>{ const k=t.dataset.k, rec=klon(al(k,{})); rec.deger=dizi(rec.deger); rec.deger[+t.dataset.i]=t.dataset.v==='1'; koy(k,rec); };
IS.pazarKapat=t=>{ const k=t.dataset.k, rec=klon(al(k,{})); rec.kapali=true; rec.tarih=ymd(bugun()); koy(k,rec); bildiri('Hafta kapandı.'); };
const pazarAyrintili=()=>{
  const b=bugun(), k='pazar:'+ymd(pazartesi(b)), rec=al(k,{}), s=simdi(), w=Math.max(0,s.w||0);
  const once=anahtarlar('pazar:').filter(x=>x!==k).sort().map(x=>al(x)).filter(x=>x.kapali).slice(-2).concat([rec]);
  const bosIs=once.length===3&&once.every(x=>!(x.s1||'').trim())&&rec.kapali;
  const dg=dizi(al('ayar:degerler',[])), degAktif=w>=34&&[0,1,2,3,4].every(i=>dg[i]&&String(dg[i]).trim());
  const son3=anahtarlar('pazar:').sort().map(x=>al(x)).filter(x=>x.kapali).slice(-3);
  const alarm=degAktif&&son3.length===3?dg.filter((_,i)=>son3.every(x=>x.deger&&x.deger[i]===false)):[];
  const yer=MADDELER.filter(m=>(al('madde:'+m.id)||{}).durum==='yerlesti');
  let h=blok('Üç soru',`<p class="aciklama">Pazar akşamı, yirmi dakika. <a href="${bolum('disiplin','5.8')}">Disiplin 5.8</a></p>
${PAZAR_S.map((q,i)=>`<label class="alan" for="p${i}"><strong>${i+1}. ${q.s}</strong><br>${q.i}</label><textarea class="yazi" id="p${i}" rows="2" data-rk="${k}" data-yol="s${i}" data-yazi>${esc(rec['s'+i]||'')}</textarea>`).join('')}
${bosIs?`<p class="sonuc"><strong>Üç haftadır ikinci soru boş.</strong> Üretmiyorsun, hazırlanıyorsun.</p>`:''}
${w>0&&w%17===0?`<label class="alan" for="p9"><strong>Dört ayda bir: hâlâ doğru şeyi mi yapıyorum?</strong></label><textarea class="yazi" id="p9" rows="2" data-rk="${k}" data-yol="buyuk" data-yazi>${esc(rec.buyuk||'')}</textarea>`:''}`);
  const pr=HAFTALIK.filter(x=>w>=x.bas);
  if(pr.length) h+=blok('Pratik',`${pr.map(x=>`<label class="onay"><input type="checkbox" data-rk="${k}" data-yol="pratik.${x.id}" ${rec.pratik&&rec.pratik[x.id]?'checked':''}><span class="kutu"></span><span>${esc(x.ad)}<small><a href="${bolum(x.k[0],x.k[1])}">${esc(docAd(x.k[0]))} ${x.k[1]}</a>${x.arac?` — <a href="#/arac/${x.arac}">defteri aç</a>`:''}</small></span></label>`).join('')}`);
  if(ARAC.kalibrasyon.acik()&&w>=12){ const tk=kayitlar('kalibrasyon'), bk=tk.filter(x=>!x.v.sonuc).length; h+=blok('Tahmin',`<p style="margin-top:0">Kalibrasyon defteri: ${tk.length} tahmin, sonucu bekleyen ${bk}. Bu hafta birkaç tahmin ekle; sonucu belli olanları işaretle.</p><div class="sira">${dugme('Deftere git','#/arac/kalibrasyon','ince')}</div>`); }
  if(yer.length) h+=blok('C',`<p class="aciklama" style="margin-top:0">Yerleşen maddeler duruyor mu? Durmuyorsa kesinti protokolü: bir kademe geri.</p>
${yer.map(m=>{ const v=rec.duruyor?rec.duruyor[m.id]:undefined; return `<div style="margin:.5rem 0"><p style="margin:0">${esc(m.ad)}</p><div class="uclu" style="grid-template-columns:1fr 1fr"><button data-is="duruyor" data-k="${k}" data-id="${m.id}" data-v="1" aria-pressed="${v===true}">Duruyor</button><button data-is="duruyor" data-k="${k}" data-id="${m.id}" data-v="0" data-v2="gitti" aria-pressed="${v===false}">Düştü</button></div></div>`; }).join('')}`);
  if(degAktif) h+=blok('Değer',`<p class="aciklama" style="margin-top:0">Bu hafta her değer için bir şey yaptın mı? <a href="${bolum('degerler','3.5')}">Değerler 3.5</a></p>
${dg.map((d,i)=>{ const v=rec.deger?rec.deger[i]:undefined; return `<div style="margin:.45rem 0"><p style="margin:0">${i+1}. ${esc(d)}</p><div class="uclu" style="grid-template-columns:1fr 1fr"><button data-is="degerIsaret" data-k="${k}" data-i="${i}" data-v="1" aria-pressed="${v===true}">✓</button><button data-is="degerIsaret" data-k="${k}" data-i="${i}" data-v="0" aria-pressed="${v===false}">✗</button></div></div>`; }).join('')}
${alarm.length?`<p class="sonuc"><strong>Üç hafta üst üste ✗:</strong> ${alarm.map(esc).join(', ')}. Ya takvimi değişecek, ya listesi.</p>`:''}`);
  h+=blok('',rec.kapali?`<p class="el">Bu hafta kapandı ✓</p>`:`<div class="sira" style="margin-top:0"><button class="dugme dolu" data-is="pazarKapat" data-k="${k}">Haftayı kapat</button></div>`);
  return {baslik:'Pazar gözden geçirmesi',alt:`${kisa(pazartesi(b))} haftası`,geri:1,html:h};
};

/* ================= AYLIK ve BAŞLANGIÇ ================= */
IS.aylikKapat=t=>{ const k=t.dataset.k, rec=klon(al(k,{})); rec.kapali=true; rec.tarih=ymd(bugun()); koy(k,rec); bildiri('Aylık oturum kapandı.'); };
function kalanHafta(){ const y=al('ayar:dogum'); if(!y) return null; return Math.max(0,Math.round(4000-fark(new Date(y,0,1),bugun())/7)); }
const aylikAyrintili=()=>{
  const b=bugun(), k='aylik:'+ymd(b).slice(0,7), rec=al(k,{}), w=Math.max(0,simdi().w||0);
  const pids=PROG.filter(p=>program(p.id).durum!=='bekliyor').map(p=>p.id), kh=kalanHafta();
  let h=blok('Beş soru',`<p class="aciklama">Otuz saniye. <a href="${bolum('plan','5.2')}">Plan 5.2</a></p>${BES_S.map((q,i)=>`<label class="alan"><strong>${i+1}.</strong> ${esc(q)}</label><textarea class="yazi" rows="1" data-rk="${k}" data-yol="c${i}" data-yazi>${esc(rec['c'+i]||'')}</textarea>`).join('')}`);
  const kl=kavramListesi(); h+=blok('Geçiş',(pids.length||kl)?`<p class="aciklama" style="margin-top:0">Her madde: yerleşti mi, sürüyor mu, gitti mi? <a href="${bolum('plan','4.2')}">Plan 4.2</a></p>${maddeListesi(pids)}${kl}`:`<p>Henüz başlamış bir program ya da okunmuş bir kavram metni yok.</p>`);
  const pr=AYLIK.filter(x=>w>=x.bas);
  if(pr.length) h+=blok('Pratik',pr.map(x=>`<label class="onay"><input type="checkbox" data-rk="${k}" data-yol="pratik.${x.id}" ${rec.pratik&&rec.pratik[x.id]?'checked':''}><span class="kutu"></span><span>${esc(x.ad)}<small><a href="${bolum(x.k[0],x.k[1])}">${esc(docAd(x.k[0]))} ${x.k[1]}</a>${x.arac?` — <a href="#/arac/${x.arac}">defteri aç</a>`:''}</small></span></label>`).join(''));
  if(w>=34||kh!=null) h+=blok('Hafta',kh!=null?`<p class="buyuk-sayi">${kh.toLocaleString('tr-TR')}</p><p class="aciklama">Dört bin haftanın kabaca kalanı. Beş dakika bak, sonra kapat. <a href="${bolum('zaman','3.1')}">Zaman 3.1</a></p>`
    :`<p>Kalan haftaları görmek için ayarlara doğum yılını yaz.</p><div class="sira">${dugme('Ayarlar','#/ayarlar','ince')}</div>`);
  h+=blok('Yedek',senkronAcik()?'<p style="margin-top:0">Senkron açık; kayıtların bulutta da bir kopyası var.</p>':`<p style="margin-top:0">${yedekDurum()}</p><div class="sira"><button class="dugme" data-is="disari">Yedeği indir</button></div>`);
  h+=blok('',rec.kapali?`<p class="el">Bu ay kapandı ✓</p>`:`<div class="sira" style="margin-top:0"><button class="dugme dolu" data-is="aylikKapat" data-k="${k}">Oturumu kapat</button></div>`);
  return {baslik:'Aylık oturum',alt:b.toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),geri:1,html:h};
};
V.baslangic=()=>{ const rec=al('bessoru:baslangic',{});
  return {baslik:'Başlangıç kaydı',alt:'Plan 5.2, Hafta 0',geri:1,html:blok('Beş soru',`<p>Bugünkü cevapların. Mezuniyet haftasında aynı soruları yeniden cevaplayıp yan yana koyacaksın.</p>
${BES_S.map((q,i)=>`<label class="alan"><strong>${i+1}.</strong> ${esc(q)}</label><textarea class="yazi" rows="1" data-rk="bessoru:baslangic" data-yol="c${i}" data-yazi>${esc(rec['c'+i]||'')}</textarea>`).join('')}`)}; };

/* ================= GEÇİŞ ================= */
IS.gecisSonuc=t=>{ const id=t.dataset.p, st=klon(program(id)); st.gecisAdim=dizi(st.gecisAdim);
  if(t.dataset.v==='tutmadi'){ st.uzatma=(st.uzatma||0)+1; st.gecisSonuc=null; st.gecisAdim=[]; koy('program:'+id,st); bildiri('İki hafta uzadı. Ölçüt iki hafta sonra yeniden.'); location.hash='#/bugun'; }
  else { st.gecisSonuc='tuttu'; st.gecisAdim[0]=true; koy('program:'+id,st); } };
IS.gecisBitir=t=>{ const id=t.dataset.p, st=klon(program(id)); st.durum='tamam'; st.bitis=ymd(bugun()); st.gecisAdim=[1,1,1,1,1,1,1].map(Boolean); koy('program:'+id,st); bildiri(PID[id].ad+' tamam. Sıradaki program seni bekliyor.'); location.hash='#/bugun'; };
function testTekrar(p){
  const t=DOC[p.id].test, at=testler(p.id), st=program(p.id); if(!t) return '';
  const bas=st.bas?tarih(st.bas):bugun(), esik=ekle(bas,Math.max(0,uzunluk(p)-7));
  const once=[...at].reverse().find(a=>tarih(a.tarih)<bas)||null, son=[...at].reverse().find(a=>tarih(a.tarih)>=esik)||null;
  if(!son) return `<div class="sonuc"><p><strong>Önce kendi testini yeniden çöz.</strong> ${once?'Sonuç, başlangıçtakiyle yan yana konacak.':'Başlangıç sonucu yok; bu sonuç bir sonraki karşılaştırmanın referansı olur.'}</p><div class="sira" style="margin-top:.4rem"><a class="dugme" href="#/test/${p.id}">Testi ${once?'yeniden ':''}çöz</a></div></div>`;
  if(!once) return `<p class="aciklama">Test ${kisa(tarih(son.tarih))} çözüldü. Başlangıç sonucu olmadığı için karşılaştırma yok.</p>`;
  const a=sayim(t,once.sec), b=sayim(t,son.sec);
  return `<p><strong>Öncesi ve sonrası</strong> <span class="aciklama">${kisa(tarih(once.tarih))} → ${kisa(tarih(son.tarih))}</span></p><div class="karsilastir">${t.gruplar.map((g,i)=>`<span>${esc(g.ad)}</span><span>${a[i]}</span><span class="el">${b[i]}</span>`).join('')}</div>`;
}
const gecisAyrintili=r=>{
  const p=PID[r.a]; if(!p) return {baslik:'Geçiş',geri:1,html:''};
  const st=program(p.id), ad=dizi(st.gecisAdim), i0=PROG.indexOf(p), onceki=i0>0?PROG[i0-1].gecis:0, sonraki=PROG[i0+1];
  const yeni=[...HAFTALIK,...AYLIK].filter(x=>x.bas>onceki&&x.bas<=p.gecis);
  const ek=[
    `${testTekrar(p)}<p><strong>Ölçüt:</strong> ${md(DOC[p.id].cikis)}</p>${st.gecisSonuc==='tuttu'?'<p class="el">Tuttu ✓</p>':`<div class="sira"><button class="dugme dolu" data-is="gecisSonuc" data-p="${p.id}" data-v="tuttu">Tuttu</button><button class="dugme kirmizi" data-is="gecisSonuc" data-p="${p.id}" data-v="tutmadi">Tutmadı, uzat</button></div>`}`,
    `<p class="aciklama">${st.gecisSonuc==='tuttu'?'Ölçüt tuttu; uzatma gerekmiyor.':'Ölçüt tutmazsa program iki hafta uzar, takvim kayar.'}</p>`,
    maddeListesi([p.id]), `<p class="aciklama">Yerleşen maddenin günlük ölçümü bu hafta bitiyor.</p>`,
    yeni.length?yeni.map(x=>`<a class="cip" href="${bolum(x.k[0],x.k[1])}">${esc(x.ad)}</a>`).join(''):'<p class="aciklama">Bu aralıkta yeni ritmik pratik yok.</p>',
    sonraki?`<p>${esc(sonraki.ad)}: <a href="${bolum(sonraki.id,sonraki.ilk)}">ilk gün</a> ve <a href="${bolum(sonraki.id,'5.1')}">Kısım 5</a>.</p>`:`<p>Sıradaki: mezuniyet haftası.</p>`,
    `<p class="aciklama">Birkaç programsız gün.</p>`];
  const h=S.gecis.map((a,i)=>blok(`<b>${i+1}</b>`,`${i>0?`<label class="onay" style="padding-top:0"><input type="checkbox" data-rk="program:${p.id}" data-yol="gecisAdim.${i}" ${ad[i]?'checked':''} ${st.gecisSonuc!=='tuttu'?'disabled':''}><span class="kutu"></span><span><strong>${esc(a.ad)}</strong></span></label>`:`<h2 class="bas">${esc(a.ad)}</h2>`}
<p class="aciklama">${md(a.metin)}</p>${ek[i]||''}`)).join('');
  return {baslik:'Geçiş haftası',alt:p.ad,geri:1,html:h+blok('',`<div class="sira" style="margin-top:0"><button class="dugme dolu" data-is="gecisBitir" data-p="${p.id}" ${st.gecisSonuc==='tuttu'?'':'disabled'}>Geçişi tamamla</button></div>`)};
};

/* ================= KESİNTİ ================= */
const kesintiSatiri=g=>g<=7?0:g<=28?1:g<=182?2:3;
IS.kesintiBasla=()=>{ if(aktifKesinti()) return; koy('kesinti:'+Date.now(),{bas:ymd(bugun())}); bildiri('Kesinti kaydedildi. Takvim bekliyor.'); };
IS.kesintiBitir=()=>{ const k=anahtarlar('kesinti:').find(x=>!al(x).bit); if(!k) return; const rec=klon(al(k)); rec.bit=ymd(bugun()); const g=fark(tarih(rec.bas),bugun()); koy(k,rec);
  levha(`<h2>Dönüş</h2><p>${g} günlük kesinti. Plan 3.5:</p><p class="el">${esc(S.kesinti[kesintiSatiri(g)].donus)}</p><p>Önce arka plan, sonra program. Telafi yok.</p><div class="sira"><button class="dugme dolu" data-is="kapat">Anladım</button></div>`); };
V.kesinti=()=>{
  const k=aktifKesinti(), g=k?fark(tarih(k.bas),bugun()):0, gec=kesintiler().filter(x=>x.bit);
  const tablo=`<div class="tablo" tabindex="0" role="region" aria-label="Kesintiler"><table><thead><tr><th>Kesinti</th><th>Dönüş</th></tr></thead><tbody>${S.kesinti.map((x,i)=>`<tr${k&&kesintiSatiri(g)===i?' style="outline:2px solid var(--kalem)"':''}><td>${esc(x.sure)}</td><td>${md(x.donus)}</td></tr>`).join('')}</tbody></table></div>`;
  return {baslik:'Kesinti',alt:'Plan 3.5',geri:1,html:blok(k?`<b>${g}</b>gün`:'',k?`<h2 class="bas">Kesintidesin</h2><p>${uzun(tarih(k.bas))} başladı. Takvim bu süre kadar kayıyor, program günleri sayılmıyor.</p>${tablo}<div class="sira"><button class="dugme dolu" data-is="kesintiBitir">Kesintiyi bitir</button></div>`
    :`<h2 class="bas">Hastalık, taşınma, beklenmedik bir yük</h2><p>Kesinti bir veri noktası, bir borç değil. Başlatınca takvim ve program günleri durur; bitirince dönüş kuralı gösterilir.</p>${tablo}<div class="sira"><button class="dugme" data-is="kesintiBasla">Kesinti başlat</button></div>`)
    +(gec.length?blok('Geçmiş',gec.map(x=>`<p style="margin:.2rem 0">${kisa(tarih(x.bas))} – ${kisa(tarih(x.bit))}, ${fark(tarih(x.bas),tarih(x.bit))} gün</p>`).join('')):'')};
};

/* ================= MEZUNİYET ================= */
IS.mezunTamam=()=>{ const rec=klon(al('mezuniyet',{})); rec.tarih=ymd(bugun()); koy('mezuniyet',rec); };
V.mezuniyet=()=>{
  const rec=al('mezuniyet',{}), ad=dizi(rec.adim), bs=al('bessoru:baslangic',{}), hepsi=S.mezuniyet.every((_,i)=>ad[i]);
  return {baslik:'Mezuniyet',alt:'Takvim 8.1',geri:1,html:
   blok('Hafta 48',`<p>İki oturum ve bir kayıt. Mezuniyetten sonra bir yıl yeni kendini geliştirme içeriği yok — yalnızca ritimler, kart ve raf.</p>
${S.mezuniyet.map((x,i)=>`<label class="onay"><input type="checkbox" data-rk="mezuniyet" data-yol="adim.${i}" ${ad[i]?'checked':''}><span class="kutu"></span><span>${baglantili(DOC.takvim,x)}</span></label>`).join('')}`)
   +(Object.keys(bs).length?blok('Hafta 0',`<p class="aciklama" style="margin-top:0">Başlangıç kaydındaki cevapların:</p>${BES_S.map((q,i)=>`<p style="margin:.3rem 0"><strong>${i+1}.</strong> ${esc(q)}<br><span class="el">${esc(bs['c'+i]||'—')}</span></p>`).join('')}`):'')
   +blok('Okuma',`<p style="margin-top:0">Dördüncü adımın ekranı: bütün kayıtlar yan yana.</p><div class="sira">${dugme('Kayıt okumasını aç','#/kayitokuma')}</div>`)
   +blok('',rec.tarih?`<p class="el">Mezun: ${uzun(tarih(rec.tarih))}</p>`:`<div class="sira" style="margin-top:0"><button class="dugme dolu" data-is="mezunTamam" ${hepsi?'':'disabled'}>Mezuniyeti tamamla</button></div>`)};
};

/* ================= MÜHÜRLER ================= */
IS.muhur=t=>{ const m=MUHUR.find(x=>x.id===t.dataset.id), a=al('muhur:'+m.id);
  levha(`<div class="kutlama" style="padding-top:0">${a?muhurSVG(m,a.tarih):muhurSVG(m,'',true)}<h2>${esc(m.ad)}</h2><p>${esc(m.a)}</p><p class="kaynak"><a href="${bolum(m.k[0],m.k[1])}" data-is="kapat">${esc(docAd(m.k[0]))} ${m.k[1]}</a></p>${a?`<p class="el">${uzun(tarih(a.tarih))}</p>`:(()=>{ const x=muhurIler(m,istatistik()); return x?`${ilerCubuk(x,m.ad+' ilerlemesi')}<p class="el">${ilerYazi(m,x)}</p>`:''; })()}</div>`); };
V.muhurler=()=>{
  const acik=MUHUR.filter(m=>al('muhur:'+m.id)), s=istatistik(), sm=siradakiMuhur(s);
  return {baslik:rehberMod()?'Dönüm noktaları':'Mühürler',alt:`${acik.length}/${MUHUR.length}`,html:blok(`<b>${acik.length}</b>/${MUHUR.length}`,`<p style="margin:0">Her mühür bir varış kaydı: tarihli, bir kez basılan, puansız. Sayı değil, dönüm noktası.</p>`)
   +(sm?blok('Sırada',`<div class="siradaki"><button class="muhur kilitli" data-is="muhur" data-id="${sm.m.id}" aria-label="${esc(sm.m.ad)}">${muhurSVG(sm.m,'',true)}</button><div><strong>${esc(sm.m.ad)}</strong><br><span class="aciklama">${esc(sm.m.a)}</span>${ilerCubuk(sm)}<span class="el">${ilerYazi(sm.m,sm)}</span></div></div>`):'')
   +blok('',`<div class="muhurler">${MUHUR.map(m=>{ const a=al('muhur:'+m.id), x=a?null:muhurIler(m,s); return `<button class="muhur ${a?'':'kilitli'}" data-is="muhur" data-id="${m.id}">${a?muhurSVG(m,a.tarih):muhurSVG(m,'',true)}<span class="ad">${esc(m.ad)}</span><span class="tarih">${a?kisa(tarih(a.tarih)):x&&x.n>0?ilerYazi(m,x):esc(m.a.split('.')[0])}</span></button>`; }).join('')}</div>`)};
};

/* ================= KART ================= */
IS.tetik=t=>{ koy('tetik:'+Date.now(),{satir:+t.dataset.i,tarih:ymd(bugun())}); bildiri('Kaydedildi. Kart işe yaradı.'); };
V.kart=()=>{
  const acik=S.tetik.filter(kartAcik).length;
  return {baslik:'Tetiklenenler kartı',alt:`${acik}/18 satır açık`,geri:1,html:blok('Kart',`<p class="aciklama" style="margin-top:0">Takvimi olmayan pratikler. Bir durum gelince aç.</p><div class="sira"><button class="cip" data-is="yazdir">Yazdır: cep kartı</button></div>
${S.tetik.map((t,i)=>{ const kul=anahtarlar('tetik:').filter(k=>al(k).satir===i).length;
  if(!kartAcik(t)) return `<div class="kart-satir kilitli"><div>${esc(t.durum)}</div><div class="ne">${esc(docAd(t.doc))} okununca açılır (Hafta ${OKW[t.doc]})</div></div>`;
  return `<details class="kart-satir"><summary><span>${esc(t.durum)}<br><span class="ne">${esc(t.ne)}</span><span class="yalniz-baski"> — ${esc(t.kaynak)}</span></span><span class="aciklama">${kul?kul+' kez':''}</span></summary>
<div class="sira"><a class="cip" href="#/oku/${t.doc}/${t.a}">${esc(t.kaynak)}</a>${KARTARAC[t.doc+':'+t.a]?`<a class="dugme dolu" href="#/arac/${KARTARAC[t.doc+':'+t.a][0]}/yeni">${KARTARAC[t.doc+':'+t.a][1]}</a>`:''}<button class="dugme" data-is="tetik" data-i="${i}">Kullandım</button></div></details>`; }).join('')}`)};
};

/* ================= AYARLAR ================= */
function temaUygula(){ const t=al('ayar:tema','oto'); if(t==='oto') delete document.documentElement.dataset.tema; else document.documentElement.dataset.tema=t; }
IS.tema=t=>{ koy('ayar:tema',t.dataset.v); temaUygula(); };
DEG.bas=t=>{ if(t.value) koy('ayar:baslangic',ymd(pazartesi(tarih(t.value)))); };
IS.giris=t=>{ const e=$('#eposta').value.trim(), p=$('#sifre').value; if(!e||!p){ bildiri('E-posta ve şifre gerekli.'); return; } senkron.giris(e,p,t.dataset.yeni==='1'); };
IS.cikis=()=>senkron.cikis();
IS.disari=()=>{ const b=new Blob([JSON.stringify({surum:1,tarih:new Date().toISOString(),r:depo.r})],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='defter-yedek-'+ymd(bugun())+'.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); koy('ayar:sonYedek',ymd(bugun())); bildiri('Yedek indirildi. Telefonun dışında bir yere kaydet.'); };
let KALICI=null;
function kaliciIste(){ try{ const d=navigator.storage; if(!d||!d.persist||!d.persisted){ KALICI='yok'; return; } d.persisted().then(p=>{ if(p){ KALICI=true; return; } if(!baslangic()){ KALICI=false; return; } return d.persist().then(ok=>{ KALICI=!!ok; }); }).catch(()=>{ KALICI='yok'; }); }catch(e){ KALICI='yok'; } }
const kayitBoyutu=()=>senkronBoyut({r:depo.r});
function yedekGun(){ const y=al('ayar:sonYedek'); return y?fark(tarih(String(y).slice(0,10)),bugun()):null; }
const senkronAcik=()=>!!(senkron.kullanici&&senkron.durum==='bagli');
function yedekGerekli(){ if(senkronAcik()||!baslangic()) return false; const s=simdi(); if(s.tip==='once'||(s.w||0)<1) return false; const g=yedekGun(); return g==null?(s.w||0)>=2:g>=30; }
function yedekDurum(){ const g=yedekGun(), b=kayitBoyutu(), o=Math.round(100*b/SENKRON_SINIR);
  return `${g==null?'Henüz yedek alınmadı.':`Son yedek: ${uzun(tarih(String(al('ayar:sonYedek')).slice(0,10)))}${g>0?`, ${g} gün önce`:', bugün'}.`} Kayıt boyutu ${Math.max(1,Math.round(b/1024)).toLocaleString('tr-TR')} KB${o>=50?`; senkron sınırının %${o}'i`:''}.${KALICI===true?' Tarayıcı kalıcı depolamaya izin verdi.':KALICI===false?' Tarayıcı kalıcı depolama izni vermedi; yedek bu yüzden daha önemli.':''}`; }
function yedekBlogu(){ if(!yedekGerekli()) return ''; const g=yedekGun(); return blok('Yedek',`<p style="margin-top:0">${g==null?'Henüz yedek alınmadı.':`Son yedek ${g} gün önce.`} Kayıtların tek kopyası bu cihazda.</p><div class="sira"><button class="dugme" data-is="disari">Yedeği indir</button>${dugme('Senkron kur','#/ayarlar','ince')}</div>`); }
DEG.iceri=t=>{ const f=t.files[0]; if(!f) return; f.text().then(x=>{ const j=JSON.parse(x); if(!j.r) throw 0; birlestir(j.r); senkron.it(true); sonrasi(); bildiri('Yedek birleştirildi.'); }).catch(()=>bildiri('Bu dosya bir Defter yedeği değil.')); };
IS.sifirla=()=>{ if(confirm('Bu cihazdaki bütün kayıtlar silinsin mi? Senkron açıksa buluttakiler geri gelir.')){ localStorage.removeItem(ANAHTAR); location.hash='#/bugun'; location.reload(); } };
V.ayarlar=()=>{
  const tema=al('ayar:tema','oto'), s0=al('ayar:baslangic',''), sd=senkron.durum, u=senkron.kullanici;
  const snk= sd==='kurulmadi'?`<p>Senkron kurulmadı. Firebase ayarları <strong>firebase-config.js</strong> dosyasına yazılınca açılır; adımlar README'de. O zamana kadar her şey bu cihazda saklanıyor.</p>`
   : sd==='yok'?`<p>Firebase yüklenemedi. İnternet bağlantısını kontrol et; kayıtlar bu cihazda güvende.</p>`
   : u?`<p>Giriş yapıldı: <strong>${esc(u.email)}</strong>. Durum: ${sd==='bagli'?'eşitlendi':sd==='hata'?'hata — tekrar denenecek':'bağlanıyor'}.</p>${senkron.hata?`<p class="sonuc">${esc(senkron.hata)}</p>`:''}<div class="sira"><button class="dugme" data-is="cikis">Çıkış yap</button></div>`
   : `<label class="alan" for="eposta">E-posta</label><input class="yazi" type="email" id="eposta" autocomplete="email">
<label class="alan" for="sifre">Şifre</label><input class="yazi" type="password" id="sifre" autocomplete="current-password">
${senkron.hata?`<p class="sonuc">${esc(senkron.hata)}</p>`:''}<div class="sira"><button class="dugme dolu" data-is="giris">Giriş yap</button><button class="dugme" data-is="giris" data-yeni="1">Hesap oluştur</button></div>
<p class="ipucu">Her cihazda aynı hesapla giriş yap; kayıtlar birleşir.</p>`;
  return {baslik:'Ayarlar',geri:1,html:
   blok('Takvim',`<label class="alan" for="ab">Hafta 1'in pazartesisi</label><input class="yazi" type="date" id="ab" data-deg="bas" value="${s0}">
<p class="ipucu">Değiştirirsen bütün takvim kayar. Uzatmalar ve kesintiler ayrıca işlenir.</p>
<label class="alan" for="dy">Doğum yılı (isteğe bağlı)</label><input class="yazi" type="number" id="dy" inputmode="numeric" min="1900" max="2030" data-rk="ayar:dogum" data-yazi value="${al('ayar:dogum','')}">
<p class="ipucu">Yalnızca aylık oturumdaki kalan hafta sayısı için.</p>${icsAlani(s0)}`)
  +blok('Görünüm',`<label class="alan" style="margin-top:0">Uygulama</label><div class="uclu" style="grid-template-columns:repeat(2,1fr)">${[['rehber','Rehber'],['ayrintili','Ayrıntılı']].map(([v,t])=>`<button data-is="gorunum" data-v="${v}" aria-pressed="${al('ayar:gorunum','rehber')===v}">${t}</button>`).join('')}</div><p class="ipucu">Rehber: her gün tek kart. Ayrıntılı: bütün listeler ve araçlar açık.</p><label class="alan">Tema</label><div class="uclu">${[['oto','Otomatik'],['gunduz','Gündüz'],['gece','Gece']].map(([v,t])=>`<button data-is="tema" data-v="${v}" aria-pressed="${tema===v}">${t}</button>`).join('')}</div><label class="alan">Okuma yazısı</label><div class="uclu" style="grid-template-columns:repeat(4,1fr)">${OLCEK.map(([v,t])=>`<button data-is="yaziSec" data-v="${v}" aria-pressed="${al('ayar:yazi','normal')===v}">${t}</button>`).join('')}</div>`)
  +blok('Senkron',snk)
  +blok('Yedek',`<p style="margin-top:0">${yedekDurum()}</p><div class="sira" style="margin-top:0"><button class="dugme" data-is="disari">Yedeği indir</button><label class="dugme">Yedekten yükle<input type="file" accept="application/json" data-deg="iceri" class="gizli"></label></div>
<p class="ipucu">Yükleme mevcut kayıtlarla birleştirir; hiçbir şeyi silmez.</p>`)
  +blok('',`<div class="sira" style="margin-top:0"><button class="dugme kirmizi" data-is="sifirla">Bu cihazı sıfırla</button></div><p class="ipucu">Defter 1.6.2. Yirmi dört metin, kırk sekiz hafta.</p>`)};
};

/* ================= ARAÇLAR ================= */
const kayitlar=a=>anahtarlar('kayit:'+a+':').map(k=>({k,v:al(k)})).sort((x,y)=>x.k<y.k?1:-1);
let acikKayit=null;
const secimler=(k,yol,d,sec)=>`<div class="uclu" style="grid-template-columns:repeat(${sec.length},1fr)" role="group">${sec.map(([v,t])=>`<button data-is="sec" data-k="${k}" data-yol="${yol}" data-v="${esc(v)}" aria-pressed="${d!=null&&String(d)===String(v)}">${t}</button>`).join('')}</div>`;
const yaziAlan=(k,yol,et,d,ip='',sat=1,ek='')=>`<label class="alan">${et}</label><textarea class="yazi" rows="${sat}" data-rk="${k}" data-yol="${yol}" data-yazi ${ek}>${esc(d||'')}</textarea>${ip?`<p class="ipucu">${ip}</p>`:''}`;
IS.sec=t=>{ const k=t.dataset.k, y=t.dataset.yol, rec=klon(al(k,{}))||{}; let v=t.dataset.v; if(/^\d+$/.test(v)) v=+v; rec[y]=rec[y]===v?null:v; koy(k,rec); };
const yeniKayit=id=>{ const a=ARAC[id], on=kayitlar(id)[0]; return Object.assign({tarih:ymd(bugun())},a&&a.yeni?a.yeni(on&&on.v):{}); };
IS.aracYeni=t=>{ const k=`kayit:${t.dataset.a}:${Date.now().toString(36)}`; acikKayit=k; koy(k,yeniKayit(t.dataset.a)); };
IS.aracAc=t=>{ acikKayit=acikKayit===t.dataset.k?null:t.dataset.k; ciz(true); };
IS.kayitAc=t=>{ acikKayit=t.dataset.k; location.hash='#/arac/'+t.dataset.a; };
IS.aracSil=t=>{ if(confirm('Bu kayıt silinsin mi?')){ acikKayit=null; koy(t.dataset.k,null); } };
const KARTARAC={'tanima:s-3-1':['iddia','İddiayı tahmine çevir'],'sinir:s-3-1':['ikisoru','İki soruyu aç'],'karar:s-3-1':['karar','Karar günlüğüne yaz'],'basarisizlik:s-3-2':['elestiri','Dört adımı aç'],'zor:s-5-1':['zor','Hazırlığı aç'],'deger:s-5-1':['deger','Hazırlığı aç'],'belirsiz:s-3-1':['belirsiz','İki listeyi aç']};
function kararHuku(v){ const t={'iyi-iyi':['İyi karar, iyi sonuç','iyi'],'iyi-kotu':['Şanslı — tekrarlama','şanslı'],'kotu-iyi':['İyi karar, kötü şans — tekrarla','kötü şans'],'kotu-kotu':['Kötü karar, öğren','öğren']}[v.sonuc+'-'+v.gerekce]; return t?{uzun:t[0],kisa:t[1]}:{uzun:'',kisa:'değerlendir'}; }
function kalibrasyonOzet(){
  const l=kayitlar('kalibrasyon').map(x=>x.v), coz=l.filter(v=>v.emin&&(v.sonuc==='tuttu'||v.sonuc==='tutmadi'));
  const sat=[[50,59],[60,69],[70,79],[80,89],[90,99]].map(([a,b])=>{ const k=coz.filter(v=>v.emin>=a&&v.emin<=b); if(!k.length) return '';
    const t=k.filter(v=>v.sonuc==='tuttu').length, bek=Math.round(k.reduce((s,v)=>s+v.emin,0)/k.length), ger=Math.round(100*t/k.length);
    const o=k.length<3?'Az veri':ger<bek-10?'Aşırı güven — "eminim"i daha az kullan':ger>bek+10?'Kendine yeterince güvenmiyorsun':'Kalibre';
    return `<tr><td>%${a}-${b}</td><td>${t}/${k.length}</td><td>${o}</td></tr>`; }).join('');
  return `<p style="margin-top:0">${l.length} tahmin, ${coz.length} sonuçlandı.${l.length<30?' Otuz tahminden sonra kalıp görünmeye başlıyor.':''}</p>`+(sat?`<div class="tablo" tabindex="0" role="region" aria-label="Kalibrasyon tablosu"><table><thead><tr><th>Emin</th><th>İsabet</th><th>Okuma</th></tr></thead><tbody>${sat}</tbody></table></div>`:'<p class="aciklama">Sonuçlanan tahmin yok. Sonuç belli olunca ✓ ya da ✗ işaretle.</p>');
}
function kararOzet(){ const l=kayitlar('karar').map(x=>x.v), s=(a,b)=>l.filter(v=>v.sonuc===a&&v.gerekce===b).length, bek=l.filter(v=>v.tarih2&&tarih(v.tarih2)<=bugun()&&!v.sonuc).length;
  return `<p style="margin-top:0">${l.length} karar${bek?`, değerlendirme bekleyen ${bek}`:''}.${l.length<30?' Orta boy kararları da yaz: yılda otuz karar, otuz veri noktası.':''}</p><div class="tablo" tabindex="0" role="region" aria-label="Karar tablosu"><table><thead><tr><th>Sonuç</th><th>Gerekçe iyiydi</th><th>Gerekçe kötüydü</th></tr></thead><tbody><tr><td>İyi</td><td>${s('iyi','iyi')}</td><td>${s('iyi','kotu')} şanslı</td></tr><tr><td>Kötü</td><td>${s('kotu','iyi')} kötü şans</td><td>${s('kotu','kotu')}</td></tr></tbody></table></div>`; }
function elestiriOzet(){ const l=kayitlar('elestiri').map(x=>x.v), c=f=>l.filter(f).length;
  return `<p style="margin-top:0">${l.length} eleştiri ayrıştırıldı: ${c(v=>v.test&&v.test!=='hayir'&&(v.eylem||'').trim())} eyleme döndü, ${c(v=>v.test==='hayir')} kişisel tercih olarak not edildi.</p>`; }
const SEVIYE={yap:'yapabiliyorum',zor:'zorlanarak',yok:'yapamıyorum'};
function haritaOzet(){ const l=kayitlar('harita').map(x=>x.v); if(!l.length) return ''; const s=l[0], o=l[1], b=dizi(s.beceri), say=g=>b.filter(x=>x.g===g).length;
  let h=`<p style="margin-top:0">${l.length} harita. Son harita: yapabiliyorum ${say('yap')}, zorlanarak ${say('zor')}, yapamıyorum ${say('yok')}.${s.secili?` Odak: <strong>${esc(s.secili)}</strong>.`:''}</p>`;
  if(o){ const ob={}; dizi(o.beceri).forEach(x=>ob[x.m]=x.g); const d=b.filter(x=>ob[x.m]&&x.g&&ob[x.m]!==x.g);
    h+=d.length?`<p><strong>Öncekiyle fark</strong> <span class="aciklama">${kisa(tarih(o.tarih))} → ${kisa(tarih(s.tarih))}</span></p>${d.map(x=>`<p style="margin:.15rem 0">${esc(x.m)}: ${SEVIYE[ob[x.m]]} → <span class="el">${SEVIYE[x.g]}</span></p>`).join('')}`:'<p class="aciklama">Öncekiyle aynı: hiçbir beceri sütun değiştirmedi.</p>';
    const sc=o.secili&&d.find(x=>x.m===o.secili); if(sc) h+=`<p class="sonuc"><strong>Odak beceri sütun değiştirdi.</strong> Ustalaşmanın çıkış ölçütü bu. ${baglantili(DOC.ustalasma,'(5.4)')}</p>`; }
  return h; }
function uretimOzet(){ const l=kayitlar('uretim').map(x=>x.v), pz=pazartesi(bugun()), bu=l.filter(v=>tarih(v.tarih)>=pz).length, sa=l.reduce((t,v)=>t+(+v.sure||0),0), og=l.filter(v=>(v.ogrenme||'').trim()).slice(0,6);
  return `<p style="margin-top:0">${l.length} satır, ${(Math.round(sa*10)/10).toLocaleString('tr-TR')} saat. Bu hafta ${bu} satır; hedef en az iki.</p>${og.length?`<p><strong>Öğrenme sütunu</strong> <span class="aciklama">tekrar eden ne?</span></p>${og.map(v=>`<p style="margin:.15rem 0" class="el">${esc(v.ogrenme)}</p>`).join('')}`:''}`; }
function ustalikSatir(){ const h=kayitlar('harita')[0], sec=h&&h.v.secili, n=kayitlar('uretim').filter(x=>tarih(x.v.tarih)>=pazartesi(bugun())).length;
  return `<p class="ipucu">${sec?`Odak: <strong>${esc(sec)}</strong>. `:'Sınır haritasından odak beceri seçilmemiş. '}Bu hafta üretim kaydı: ${n}/2. <a class="ref" href="#/arac/harita">Harita</a> <a class="ref" href="#/arac/uretim">Kayıt</a></p>`; }
const ISLEV=[['ihtiyac','İhtiyaç'],['guvenlik','Güvenlik'],['secenek','Seçenek'],['statu','Statü'],['aliskanlik','Alışkanlık'],['kullanilmiyor','Kullanılmıyor']];
const TL=n=>Math.round(+n||0).toLocaleString('tr-TR')+' ₺';
function saatFiyati(){ const a=al('para:ayar',{}); return +a.gelir>0&&+a.saat>0?(+a.gelir)/(+a.saat):null; }
function saatYazi(m){ const s=saatFiyati(); if(!s||!(+m>0)) return ''; const h=(+m)/s; return h<1?`${Math.max(1,Math.round(h*60))} dakika`:`${(Math.round(h*10)/10).toLocaleString('tr-TR')} saat`; }
const beklemeBitis=v=>ekle(tarih(v.tarih),v.tur==='buyuk'?30:2);
const sayiOku=v=>{ let t=String(v==null?'':v).trim().replace(/\s/g,''); if(!t) return NaN; if(t.includes(',')&&t.includes('.')) t=t.replace(/\./g,'').replace(',','.'); else if(t.includes(',')) t=t.replace(',','.'); else if(/^\d{1,3}(\.\d{3})+$/.test(t)) t=t.replace(/\./g,''); const x=parseFloat(t); return isFinite(x)?x:NaN; };
IS.harcamaEkle=()=>{ const ne=$('#hc-ne').value.trim(), m=sayiOku($('#hc-m').value), is=$('#hc-is').value; if(!ne||!(m>0)){ bildiri('Ne ve miktar gerekli.'); return; } koy(`kayit:harcama:${Date.now().toString(36)}`,{tarih:ymd(bugun()),ne,miktar:m,islev:is}); };
IS.beklemeEkle=()=>{ const ne=$('#bk-ne').value.trim(), f=sayiOku($('#bk-f').value); if(!ne){ bildiri('Ne istediğini yaz.'); return; } koy(`kayit:bekleme:${Date.now().toString(36)}`,{tarih:ymd(bugun()),ne,tur:$('#bk-tur').value,fiyat:f>0?f:null,durum:'bekliyor'}); };
IS.beklemeSonuc=t=>{ const k=t.dataset.k, r=klon(al(k,{})); r.durum=t.dataset.v; r.sonTarih=ymd(bugun()); koy(k,r); };
IS.kayitSil=t=>koy(t.dataset.k,null);
document.addEventListener('input',e=>{ if(e.target.dataset&&e.target.dataset.canli==='saat'){ const d=$('#sf-sonuc'); if(d) d.textContent=saatYazi(sayiOku(e.target.value))||''; } });
function paraSatir(){ const n=kayitlar('harcama').filter(x=>x.v.tarih===ymd(bugun())).length; return `<p class="ipucu">Bugün ${n} harcama kaydı. <a class="ref" href="#/arac/para">Kaydet</a></p>`; }
function paraSayfasi(a){
  const ay=al('para:ayar',{}), s=saatFiyati(), b=bugun(), ayBas=new Date(b.getFullYear(),b.getMonth(),1), h=kayitlar('harcama'), bu=h.filter(x=>tarih(x.v.tarih)>=ayBas);
  const top=bu.reduce((t,x)=>t+(+x.v.miktar||0),0), son30=h.filter(x=>tarih(x.v.tarih)>ekle(b,-30)).reduce((t,x)=>t+(+x.v.miktar||0),0);
  const isT=ISLEV.map(([id,ad])=>[ad,bu.filter(x=>x.v.islev===id).reduce((t,x)=>t+(+x.v.miktar||0),0)]).filter(x=>x[1]>0), gun=new Set(bu.map(x=>x.v.tarih)).size;
  const bk=kayitlar('bekleme'), bek=bk.filter(x=>x.v.durum==='bekliyor'), son=bk.filter(x=>x.v.durum!=='bekliyor'), vaz=son.filter(x=>x.v.durum==='vazgectim').length;
  const aylik=ay.harcamaAy!=null&&ay.harcamaAy!==''?+ay.harcamaAy:son30, yet=aylik+(+ay.tampon||0)+(+ay.statu||0), P=x=>baglantili(DOC.para,x);
  const num=(yol,et,ek='')=>`<label class="alan">${et}</label><input class="yazi" type="number" inputmode="decimal" min="0" data-rk="para:ayar" data-yol="${yol}" value="${ay[yol]==null?'':ay[yol]}" ${ek}>`;
  return {baslik:a.ad,alt:'Para Davranışı 3.2-3.6',geri:1,html:
   blok(s?`<b>${Math.round(s).toLocaleString('tr-TR')}</b>₺/sa`:'Saat',`<h3 class="bas" style="margin-top:0">Saat fiyatı ${P('(3.6)')}</h3>${num('gelir','Aylık net gelir (₺)')}${num('saat','Aylık çalışma saati')}
${s?`<p>Saatte <strong>${TL(s)}</strong>. Her harcama: kaç saat?</p><label class="alan">Bu kaç saat?</label><input class="yazi" inputmode="decimal" placeholder="Tutar" data-canli="saat"><p class="el" id="sf-sonuc"></p>`:'<p class="ipucu">İkisini yaz; harcamaların yanında saat karşılığı da görünsün.</p>'}`)
  +blok(`<b>${gun}</b>gün`,`<h3 class="bas" style="margin-top:0">Harcama kaydı ${P('(3.2)')}</h3><p class="aciklama">Her harcama, aynı gün, tek satır. Yargı yok.</p>
<label class="alan" for="hc-ne">Ne?</label><input class="yazi" id="hc-ne"><label class="alan" for="hc-m">Miktar (₺)</label><input class="yazi" id="hc-m" inputmode="decimal">
<label class="alan" for="hc-is">İşlev</label><select class="yazi" id="hc-is">${ISLEV.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select><div class="sira"><button class="dugme dolu" data-is="harcamaEkle">Kaydet</button></div>
<p style="margin-top:1rem"><strong>Bu ay:</strong> ${TL(top)}${s?` (${saatYazi(top)})`:''}, ${bu.length} kayıt, ${gun} gün.</p>${isT.length?isT.map(([ad,t])=>`<p style="margin:.1rem 0">${ad}: ${TL(t)}${ad==='Statü'?' <span class="aciklama">sandığından dolu mu?</span>':''}</p>`).join(''):''}
${bu.slice(0,40).map(({k,v})=>`<div class="liste-satir"><span class="liste-m">${kisa(tarih(v.tarih))}, ${esc(v.ne)} <span class="aciklama">${TL(v.miktar)}${s?', '+saatYazi(v.miktar):''}, ${(ISLEV.find(x=>x[0]===v.islev)||[0,''])[1].toLocaleLowerCase('tr')}</span></span><button class="ikon" data-is="kayitSil" data-k="${k}" aria-label="Sil">×</button></div>`).join('')}`)
  +blok(bek.length?`<b>${bek.length}</b>sırada`:'Bekle',`<h3 class="bas" style="margin-top:0">Bekleme listesi ${P('(3.3)')}</h3><p class="aciklama">Zorunlu olmayan her şey: küçük iki gün, büyük otuz gün. Süre dolunca hâlâ istiyorsan al.</p>
<label class="alan" for="bk-ne">Ne istiyorsun?</label><input class="yazi" id="bk-ne"><label class="alan" for="bk-f">Fiyat (isteğe bağlı)</label><input class="yazi" id="bk-f" inputmode="decimal">
<label class="alan" for="bk-tur">Tür</label><select class="yazi" id="bk-tur"><option value="kucuk">Küçük — iki gün</option><option value="buyuk">Büyük — otuz gün</option></select><div class="sira"><button class="dugme" data-is="beklemeEkle">Listeye yaz</button></div>
${bek.map(({k,v})=>{ const d=beklemeBitis(v)<=b; return `<div class="liste-satir"><span class="liste-m">${esc(v.ne)}${v.fiyat?` <span class="aciklama">${TL(v.fiyat)}${s?', '+saatYazi(v.fiyat):''}</span>`:''}<br><span class="aciklama">${d?'Süre doldu: hâlâ istiyor musun?':'Bitiş '+kisa(beklemeBitis(v))}</span></span>${d?`<button class="cip" data-is="beklemeSonuc" data-k="${k}" data-v="aldim">Aldım</button><button class="cip" data-is="beklemeSonuc" data-k="${k}" data-v="vazgectim">Vazgeçtim</button>`:`<button class="ikon" data-is="kayitSil" data-k="${k}" aria-label="Sil">×</button>`}</div>`; }).join('')}
${son.length?`<p class="ipucu">Sonuçlanan ${son.length}: ${vaz} vazgeçildi, ${son.length-vaz} alındı.</p>`:''}`)
  +blok(yet>0?`<b>${Math.round(yet/1000).toLocaleString('tr-TR')}</b>bin ₺`:'Yeter',`<h3 class="bas" style="margin-top:0">Yeterince sayısı ${P('(3.4)')}</h3><p class="aciklama">Bir aylık kayıt, artı tampon, artı makul statü payı. Toplam: yeterince.</p>
${num('harcamaAy','Aylık harcama (₺)',`placeholder="Son otuz günün kaydı: ${Math.round(son30).toLocaleString('tr-TR')}"`)}${num('tampon','Tampon için aylık pay (₺)')}${num('statu','Makul statü payı (₺)')}
${yet>0?`<p class="buyuk-sayi" style="margin-top:.8rem">${TL(yet)}</p><p class="aciklama">Aylık. Hedef "daha çok" değil, bu rakam.</p>`:''}
${yaziAlan('para:ayar','varinca','Sayıya varınca ne olacak?',ay.varinca,'Cevap "daha çok" ise sayı yoktu. "İş saatimi düşürürüm, şunu yaparım" ise sayı gerçek.',2)}`)};
}
const KANIT_K=[['is','İş'],['aile','Aile'],['saglik','Sağlık'],['ogrenme','Öğrenme'],['uretme','Üretme'],['tuketme','Tüketme'],['dinlenme','Dinlenme'],['sosyal','Sosyal']];
const DIKKAT_S=[['','—'],['cok','Çok'],['orta','Orta'],['az','Az'],['yok','Yok']];
function kanitSira(v){ const t=v.t||{}, dp={cok:3,orta:2,az:1,yok:0}; return KANIT_K.map(([id,ad])=>{ const r=t[id]||{}; return {id,ad,saat:+r.saat||0,para:+r.para||0,dik:dp[r.dikkat]||0}; }).sort((a,b)=>b.saat-a.saat||b.para-a.para||b.dik-a.dik); }
function kanitSonuc(v){ const s=kanitSira(v).filter(x=>x.saat||x.para||x.dik); if(!s.length) return ''; const dg=dizi(al('ayar:degerler',[])).filter(x=>x&&String(x).trim());
  return `<p style="margin-top:1rem"><strong>Yaşanan sıra</strong></p>${s.slice(0,5).map((x,i)=>`<p style="margin:.1rem 0">${i+1}. ${x.ad} <span class="aciklama">${x.saat} saat${x.para?', '+TL(x.para):''}</span></p>`).join('')}
${dg.length?`<p style="margin-top:.8rem"><strong>Söylenen değerler</strong></p>${dg.map((x,i)=>`<p style="margin:.1rem 0" class="el">${i+1}. ${esc(x)}</p>`).join('')}<p class="ipucu">${baglantili(DOC.degerler,'Fark, 1.1\'deki aralık. Tablo, söz değil.')}</p>`:'<p class="ipucu">Söylediğin beş değeri Defter\'e yaz, yan yana gelsin. <a class="ref" href="#/defter/d">Değerler</a></p>'}`; }
const sayiAlan=(k,yol,et,d)=>`<label class="alan">${et}</label><input class="yazi" type="number" min="0" step="any" inputmode="decimal" data-rk="${k}" data-yol="${yol}" value="${d==null?'':d}">`;
const kalanKez=v=>+v.siklik>0&&+v.yil>0?Math.round(+v.siklik*+v.yil):null;
function birdahaOzet(){ const l=kayitlar('birdaha').map(x=>x.v).filter(v=>kalanKez(v)!=null).sort((a,b)=>kalanKez(a)-kalanKez(b));
  return l.length?`${l.map(v=>`<p style="margin:.15rem 0">${esc(v.ne||'adsız')}: <strong>${kalanKez(v).toLocaleString('tr-TR')}</strong> kez</p>`).join('')}<p class="ipucu">Sayı küçük olan satırlar için "sonra" cümlesi kuruluyor mu?</p>`:''; }
IS.tahminKilit=t=>{ const k=t.dataset.k, rec=klon(al(k,{})); if(!(rec[t.dataset.alan]||'').trim()){ bildiri('Önce tahmini yaz.'); return; } rec.kilit=true; koy(k,rec); };
function iddiaOzet(){ const l=kayitlar('iddia').map(x=>x.v), c=d=>l.filter(v=>v.sonuc===d).length;
  return `<p style="margin-top:0">${l.length} iddia: ${c('tuttu')} tuttu, ${c('tutmadi')} tutmadı, ${c('kosul')} "şu koşulda". Veri çoğu zaman evet ya da hayır demiyor; koşul söylüyor.</p>`; }
function tahminOzet(){ const l=kayitlar('tahmin').map(x=>x.v), s=l.filter(v=>v.yon), c=d=>s.filter(v=>v.yon===d).length;
  const kal=s.length>=5?(c('abarttim')>=s.length*.6?'Çoğunlukla abartıyorsun.':c('az')>=s.length*.6?'Çoğunlukla az tahmin ediyorsun.':'Belirgin bir yön yok.'):'';
  return `<p style="margin-top:0">${l.length} tahmin, ${s.length} sonuçlandı: ${c('abarttim')} abarttım, ${c('tuttu')} tuttu, ${c('az')} az tahmin.${s.length<10?' On kayıttan sonra kalıp netleşiyor.':''}</p>${kal?`<p class="sonuc"><strong>${kal}</strong> Bir sonraki büyük kararda tahminini bu kalıba göre düzelt.</p>`:''}`; }
function enerjiSayfasi(a){ const l=kayitlar('enerji'), gr={};
  l.forEach(({v})=>{ const ad=(v.etkinlik||'').trim(); if(!ad) return; const kk=ad.toLocaleLowerCase('tr'); gr[kk]=gr[kk]||{ad,p:0,m:0,s:0}; gr[kk][v.isaret==='+'?'p':v.isaret==='-'?'m':'s']++; });
  const net=Object.values(gr).map(x=>({...x,n:x.p+x.m+x.s})).map(x=>({...x,d:(x.p-x.m)/x.n})).sort((a,b)=>b.d-a.d||b.n-a.n), gun=new Set(l.map(x=>x.v.tarih)).size;
  const isr=x=>'+'.repeat(x.p)+'−'.repeat(x.m)+'0'.repeat(x.s);
  return {baslik:a.ad,alt:'Kendini Tanıma 3.5',geri:1,html:blok(`<b>${gun}</b>gün`,`<p style="margin-top:0">Her etkinlikten sonra tek işaret, iki hafta. <a class="ref" href="${bolum('tanima','3.5')}">Kendini tanıma 3.5</a></p><label class="alan" for="en-ne">Etkinlik</label><input class="yazi" id="en-ne" placeholder="Toplantı, yürüyüş, öğretmek"><div class="sira"><button class="dugme" data-is="enerjiEkle" data-v="+">+ verdi</button><button class="dugme" data-is="enerjiEkle" data-v="0">0 nötr</button><button class="dugme kirmizi" data-is="enerjiEkle" data-v="-">− aldı</button></div>`)
   +(net.length?blok('Harita',`${net.map(x=>`<div class="liste-satir"><span class="liste-m">${esc(x.ad)}</span><span class="el" style="font-size:1.3rem;letter-spacing:.08em">${isr(x)}</span></div>`).join('')}<p class="ipucu">Harita hikâyeyle çelişirse haritayı dinle: − olanları azalt, + olanları takvime koy.</p>`):'')
   +(l.length?blok('Son',l.slice(0,15).map(({k,v})=>`<div class="liste-satir"><span class="liste-m">${kisa(tarih(v.tarih))}, ${esc(v.etkinlik)}</span><span class="el">${v.isaret==='-'?'−':v.isaret}</span><button class="ikon" data-is="kayitSil" data-k="${k}" aria-label="Sil">×</button></div>`).join('')):'')}; }
IS.enerjiEkle=t=>{ const e=$('#en-ne').value.trim(); if(!e){ bildiri('Etkinliği yaz.'); return; } koy(`kayit:enerji:${Date.now().toString(36)}`,{tarih:ymd(bugun()),etkinlik:e,isaret:t.dataset.v}); };
function ikiYol(v){ if(!v.deg||!v.deger) return null; const t={'evet-evet':['Değiştir','değiştir','Program, sırayla: plandaki sekiz programdan hangisine ait?'],'evet-hayir':['Bırak','bırak','Yapılmayacaklar listesine. Bedeli yalnızca sanaysa kusur bütçesine de aday (3.4).'],'zor-evet':['Yönet','yönet','Özelliği değil, ortamı ve durumu değiştir.'],'zor-hayir':['Kabul et','kabul','Bedeli yalnızca sanaysa kusur bütçesine (3.4).']}[v.deg+'-'+v.deger]; return t?{ad:t[0],kisa:t[1],aciklama:t[2]}:null; }
function ikisoruOzet(){ const l=kayitlar('ikisoru').map(x=>x.v), c=y=>l.filter(v=>{ const r=ikiYol(v); return r&&r.kisa===y; }).length;
  return `<p style="margin-top:0">${l.length} dürtü: değiştir ${c('değiştir')}, bırak ${c('bırak')}, yönet ${c('yönet')}, kabul ${c('kabul')}. İkinci soru, gelişim listesinin yarısını siliyor.</p>`; }
function kusurOzet(){ const l=kayitlar('kusur').map(x=>x.v), b=l.filter(v=>v.bedel==='ben').length, i=l.filter(v=>v.bedel==='baskasi').length;
  return `<p style="margin-top:0">Bütçede ${b} kusur${i?`; ${i} tanesi bütçe değil, iş`:''}.${b>3?' Bütçe iki-üç kusur.':''}</p>`; }
V.kayitokuma=()=>{ const y=String(bugun().getFullYear()), k='okuma:'+y, rec=al(k,{}), Z=x=>baglantili(DOC.tanima,x);
  const ac=Object.entries(ARAC).filter(([,a])=>a.acik()).sort((x,z)=>(OKW[x[1].doc]??99)-(OKW[z[1].doc]??99));
  const git=MADDELER.filter(m=>(al('madde:'+m.id)||{}).durum==='gitti');
  const sor=[['s1','Hangi tür değişiklik bende tutuyor, hangisi gitmiyor?','"Gitti" sütunundaki maddelerin ortak özelliği ne? Hepsi sabah mıydı, hepsi başka insan mı gerektiriyordu, hepsi on dakikadan uzun muydu?'],['s2','Hangi koşulda en iyi hâlimdeyim?','Blok kaydı, tetiklenme tablosu, enerji haritası: iyi günlerin ortak yanı ne?'],['s3','Hikâyem ile kayıtlarım nerede ayrışıyor?','Kendini tarif ettiğin beş cümle, ve kayıtların her biri hakkında söylediği (1.3).']];
  return {baslik:'Kayıt okuması',alt:`${y}, Kendini Tanıma 3.4`,geri:1,html:blok('Okuma',`<p style="margin-top:0">${Z('Yılda bir, iki saat. Bütün kayıtlar yan yana, üç soru, yazarak (3.4).')}</p>`)
   +blok(git.length?`<b>${git.length}</b>gitti`:'Gitti',git.length?`<p style="margin-top:0"><strong>"Gitti" sütunu</strong> <span class="aciklama">hiçbir metnin sana söyleyemeyeceği bilgi</span></p>${git.map(m=>{ const x=al('madde:'+m.id,{}); return `<p style="margin:.2rem 0">${esc(m.ad)}${x.neden?`<br><span class="el">${esc(x.neden)}</span>`:''}</p>`; }).join('')}`:'<p class="aciklama" style="margin-top:0">"Gitti" sütununda madde yok.</p>')
   +ac.map(([id,a])=>{ let o=''; try{ o=a.ozet?a.ozet():''; }catch(e){ o=''; } return blok('',`<h3 class="bas" style="margin-top:0"><a href="#/arac/${id}">${esc(a.ad)}</a></h3>${o||`<p class="aciklama" style="margin:0">Kaydı araçta: <a class="ref" href="#/arac/${id}">aç</a></p>`}`); }).join('')
   +blok('Üç soru',sor.map(([f,q,i])=>`<label class="alan"><strong>${q}</strong><br>${Z(i)}</label><textarea class="yazi" rows="3" data-rk="${k}" data-yol="${f}" data-yazi>${esc(rec[f]||'')}</textarea>`).join(''))}; };
const PDURUM=[['bitis','Bitişe gidiyor'],['askida','Askıda'],['bitti','Bitti']];
function listeAlan(k,yol,et,items,o={}){ items=dizi(items); const id=('l'+k+yol).replace(/[^a-zA-Z0-9]/g,'');
  return `<label class="alan">${et}</label>${items.map((x,i)=>`<div class="liste-satir">${o.onay?`<label class="onay"><input type="checkbox" data-deg="listeOnay" data-k="${k}" data-yol="${yol}" data-i="${i}" ${x.x?'checked':''}><span class="kutu"></span><span>${esc(x.m)}</span></label>`:`<span class="liste-m">${esc(x.m)}</span>`}<button class="ikon" data-is="listeSil" data-k="${k}" data-yol="${yol}" data-i="${i}" aria-label="Sil">×</button></div>${o.gruplar?`<div class="uclu" style="grid-template-columns:repeat(${o.gruplar.length},1fr);margin:0 0 .5rem">${o.gruplar.map(([v,t])=>`<button data-is="listeGrup" data-k="${k}" data-yol="${yol}" data-i="${i}" data-v="${v}" aria-pressed="${x.g===v}">${t}</button>`).join('')}</div>`:''}`).join('')}<div class="liste-ekle"><input class="yazi" id="${id}" placeholder="${esc(o.yer||'Ekle')}" enterkeyhint="done"><button class="dugme" data-is="listeEkle" data-k="${k}" data-yol="${yol}" data-girdi="${id}">Ekle</button></div>`; }
const listeDegis=(t,f)=>{ const k=t.dataset.k, rec=klon(al(k,{}))||{}, l=dizi(rec[t.dataset.yol]); f(l,+t.dataset.i); rec[t.dataset.yol]=l; koy(k,rec); };
IS.listeEkle=t=>{ const e=document.getElementById(t.dataset.girdi), m=(e&&e.value||'').trim(); if(!m) return; listeDegis(t,l=>l.push({m})); };
IS.listeSil=t=>listeDegis(t,(l,i)=>l.splice(i,1));
IS.listeGrup=t=>listeDegis(t,(l,i)=>{ if(l[i]) l[i].g=l[i].g===t.dataset.v?null:t.dataset.v; });
DEG.listeOnay=t=>listeDegis(t,(l,i)=>{ if(l[i]) l[i].x=t.checked; });
document.addEventListener('keydown',e=>{ const f=e.key==='Enter'&&e.target.closest&&e.target.closest('.liste-ekle'); if(f){ e.preventDefault(); f.querySelector('button').click(); } });
document.addEventListener('input',e=>{ if(e.target.dataset&&e.target.dataset.canli==='kucultme'){ const d=e.target.closest('.ic')&&e.target.closest('.ic').querySelector('.kucultme'); if(d) d.outerHTML=kucultmeKontrol(e.target.value); } });
function kesmeUyari(v){ const l=dizi(v.kesme), c=g=>l.filter(x=>x.g===g).length; if(!l.length) return '';
  if(l.length>=3&&c('olmaz')>l.length/2) return `<p class="sonuc"><strong>Hepsini "olmazsa olmaz" saymak, liste yapmamakla aynı.</strong> Test: bu olmasa, yabancı ana işi yapabilir mi? Yapabiliyorsa kes.</p>`;
  return `<p class="ipucu">Olmazsa olmaz ${c('olmaz')}, olsa iyi ${c('iyi')}, sonra ${c('sonra')}, asla ${c('asla')}.</p>`; }
IS.tanimKilit=t=>{ const k=t.dataset.k, rec=klon(al(k,{})); if(!(rec.ana||'').trim()||!(rec.olcu||'').trim()||!rec.bitis){ bildiri('Üç maddenin üçü de yazılı olmalı.'); return; } rec.kilit=true; koy(k,rec); };
IS.tanimAc=t=>{ if(!confirm('Tanımı genişleten kişi, tanımı iptal ediyor (bitirme 3.1). Yine de açılsın mı?')) return; const k=t.dataset.k, rec=klon(al(k,{})); rec.kilit=false; koy(k,rec); };
function projeOzet(){ const l=kayitlar('proje').map(x=>x.v), bit=l.filter(v=>v.durum==='bitis'), sira=l.filter(v=>v.durum!=='bitti').map(v=>({v,p:['q1','q2','q3'].filter(q=>v[q]).length})).sort((a,b)=>b.p-a.p);
  return `<p style="margin-top:0">${l.length} proje, ${l.filter(v=>v.durum==='bitti').length} bitti.</p>${bit.length>1?`<p class="sonuc"><strong>Aynı anda bir proje bitişe gider.</strong> Şu an ${bit.length} proje "bitişe gidiyor" olarak işaretli. ${baglantili(DOC.bitirme,'(4.2)')}</p>`:''}${sira.length>1?`<p><strong>Üç soruya göre sıra</strong></p>${sira.map(x=>`<p style="margin:.15rem 0">${x.p} evet: ${esc(x.v.ad||'adsız')}${x.v.durum==='bitis'?' <span class="el">bitişe gidiyor</span>':''}</p>`).join('')}`:''}`; }
function projeSatir(){ if(!ARAC.proje.acik()) return ''; const p=kayitlar('proje').find(x=>x.v.durum==='bitis');
  if(!p) return `<p class="ipucu">Bitişe giden bir proje seçilmemiş. <a class="ref" href="#/arac/proje">Projeler</a></p>`;
  const v=p.v, g=v.bitis?fark(bugun(),tarih(v.bitis)):null;
  return `<p class="ipucu"><strong>${esc(v.ad||'Proje')}</strong>${v.ana?': '+esc(v.ana):''}${g!=null?`. Bitişe ${g>=0?g+' gün':'tarih '+Math.abs(g)+' gün geçti'}`:''}. <a class="ref" href="#/arac/proje">Tanım</a></p>`; }
function iletisimSayfasi(a){ const p=PID.iletisim, st=program('iletisim'); if(!st.bas) return {baslik:a.ad,geri:1,html:blok('',`<p>İletişim programı başlayınca burada günlük üç sayı birikir: özetleme, kestim, durdum.</p>`)};
  const n=Math.min(programGunu(p),uzunluk(p)), rows=[]; for(let i=1;i<=n;i++){ const g=gunKaydi('iletisim',i); rows.push([i,g.m,g.kes,g.dur]); }
  const top=(a,b)=>rows.slice(a,b).reduce((s,r)=>[s[0]+(+r[1]||0),s[1]+(+r[2]||0),s[2]+(+r[3]||0)],[0,0,0]), h=Math.ceil(rows.length/2), i1=top(0,h), i2=top(h,rows.length), v=x=>x==null||x===''?'—':x;
  return {baslik:a.ad,alt:'İletişim 5.1',geri:1,html:blok('Özet',`<p style="margin-top:0">Toplam: özetleme ${i1[0]+i2[0]}, kestim ${i1[1]+i2[1]}, durdum ${i1[2]+i2[2]}.${rows.length>=6?` İlk yarıda kestim ${i1[1]}, durdum ${i1[2]}; son yarıda kestim ${i2[1]}, durdum ${i2[2]}.`:''}</p><p class="ipucu">Kestiğin ve kesmek üzereyken durduğun ayrı sayılıyor. <a class="ref" href="${bolum('iletisim','5.1')}">İletişim 5.1</a></p>`)
   +blok('Kayıt',`<div class="tablo" tabindex="0" role="region" aria-label="İletişim sayıları"><table><thead><tr><th>Gün</th><th>Özetleme</th><th>Kestim</th><th>Durdum</th></tr></thead><tbody>${rows.slice().reverse().map(r=>`<tr><td>${r[0]}</td><td>${v(r[1])}</td><td>${v(r[2])}</td><td>${v(r[3])}</td></tr>`).join('')}</tbody></table></div><p class="ipucu">Sayılar Bugün ekranından, konuşmadan hemen sonra, hafızadan.</p>`)}; }
function kucultmeKontrol(s){ s=(s||'').trim(); if(!s) return '<div class="kucultme"></div>';
  const bul=(S.kucultme||[]).filter(x=>new RegExp('(^|[^\\p{L}])'+x.k.toLocaleLowerCase('tr').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^\\p{L}])','u').test(s.toLocaleLowerCase('tr')));
  return `<div class="kucultme">${bul.length?`<p class="sonuc"><strong>Küçültme dili:</strong> ${bul.map(x=>`${esc(x.ifade)} → ${esc(x.yerine)}`).join('; ')}. ${baglantili(DOC.deger,'(4.6)')}</p>`:'<p class="ipucu">Küçültme kelimesi yok.</p>'}</div>`; }
function degerOzet(){ const l=kayitlar('deger').map(x=>x.v), y=l.filter(v=>v.tarihG&&tarih(v.tarihG)>=bugun()).length;
  return `<p style="margin-top:0">${l.length} görüşme hazırlığı${y?`, yaklaşan ${y}`:''}. Görüşme, o bir saatin özeti.</p>`; }
function belirsizOzet(){ const l=kayitlar('belirsiz').map(x=>x.v), acik=l.filter(v=>{ const s=dizi(v.sol); return s.length&&s.some(x=>!x.x); }).length;
  return `<p style="margin-top:0">${l.length} belirsizlik${acik?`; sol listesi bitmemiş ${acik}`:''}. Sol liste bittiğinde, sağ listeye harcayacak bir şey kalmıyor.</p>`; }
const TEKRAR=[[1,0,'Aynı gün ya da ertesi sabah'],[2,2,'2-3 gün sonra'],[3,7,'Bir hafta sonra'],[4,30,'Bir ay sonra']];
function sonrakiTekrar(v){ if(!v||!v.tarih) return null; for(const [i,g] of TEKRAR){ if(!v['t'+i]){ const t=ekle(tarih(v.tarih),g); return {i,t,gecti:t<=bugun()}; } } return null; }
IS.tekrarYap=t=>{ const k=t.dataset.k, rec=klon(al(k,{})); rec['t'+t.dataset.i]=ymd(bugun()); koy(k,rec); };
function duyguOzet(){
  const l=kayitlar('duygu').map(x=>x.v).reverse(), tam=l.filter(v=>v.siddet&&v.buyukluk);
  if(!tam.length) return '<p class="aciklama" style="margin-top:0">Tam satır yok: şiddeti ve olay büyüklüğünü işaretle.</p>';
  const ort=a=>a.length?(Math.round(10*a.reduce((s,x)=>s+x,0)/a.length)/10).toLocaleString('tr-TR'):'—', say={};
  tam.forEach(v=>{ const ad=(v.tetik||'').trim(); if(!ad) return; const kk=ad.toLocaleLowerCase('tr'); say[kk]=say[kk]||{ad,n:0,f:[]}; say[kk].n++; say[kk].f.push(v.siddet-v.buyukluk); });
  const tl=Object.values(say), sik=tl.slice().sort((a,b)=>b.n-a.n)[0], ac=tl.map(x=>({ad:x.ad,f:x.f.reduce((s,y)=>s+y,0)/x.f.length})).filter(x=>x.f>=2).sort((a,b)=>b.f-a.f).slice(0,3);
  const uy=tam.filter(v=>v.uyku!=null&&v.uyku!==''), az=uy.filter(v=>+v.uyku<6).map(v=>v.siddet), cok=uy.filter(v=>+v.uyku>=6).map(v=>v.siddet);
  const ar=l.map(v=>v.aralik==null||v.aralik===''?null:(+v.aralik)*(v.birim==='dk'?60:1)).filter(x=>x!=null), y=Math.floor(ar.length/2);
  return `<p style="margin-top:0">${tam.length} satır. Ortalama fark, şiddet eksi olay: <strong>${ort(tam.map(v=>v.siddet-v.buyukluk))}</strong>.</p>
<p><strong>Hangi tetikleyici en sık?</strong><br>${sik?`${esc(sik.ad)}: ${sik.n} kez`:'Tetikleyici yazılmamış.'}</p>
<p><strong>Fark en çok nerede açılıyor?</strong><br>${ac.length?ac.map(x=>`${esc(x.ad)} (${(Math.round(10*x.f)/10).toLocaleString('tr-TR')})`).join(', '):'İki puanı geçen fark yok.'}</p>
<p><strong>Düşük uyku ile yüksek şiddet örtüşüyor mu?</strong><br>${az.length&&cok.length?`Altı saatin altındaki günlerde ortalama şiddet ${ort(az)}, üstündekilerde ${ort(cok)}.`:'Karşılaştırmak için hem az hem yeterli uykulu günlerden satır gerekiyor.'}</p>
${ar.length>=4?`<p class="ipucu">Aralık: ilk yarıda ortalama ${ort(ar.slice(0,y))} saniye, son yarıda ${ort(ar.slice(y))} saniye.</p>`:''}
<p class="ipucu">Üç soru, programın altıncı haftasının sonunda soruluyor. <a class="ref" href="${bolum('duygu','5.4')}">Duygu 5.4</a></p>`;
}
function ogrenmeOzet(){ const l=kayitlar('ogrenme').map(x=>x.v), yap=l.reduce((n,v)=>n+TEKRAR.filter(([i])=>v['t'+i]).length,0), sira=l.filter(v=>{ const t=sonrakiTekrar(v); return t&&t.gecti; }).length;
  return `<p style="margin-top:0">${l.length} konu, ${yap}/${l.length*4} tekrar yapıldı${sira?`; bugün sırası gelen ${sira}`:''}. Dört tekrar, toplam yirmi dakika.</p>`; }
function zorOzet(){ const l=kayitlar('zor').map(x=>x.v), c=d=>l.filter(v=>v.sonuc===d).length;
  return `<p style="margin-top:0">${l.length} hazırlık. İstediğin oldu: ${c('evet')}, kısmen: ${c('kismen')}, olmadı: ${c('hayir')}.</p>`; }
const ARAC={
 kalibrasyon:{ad:'Kalibrasyon defteri',doc:'berrak',b:'3.4',acik:()=>okundu('berrak'),giris:'Tahmin, ne kadar emin olduğun, tarih. Sonuç belli olunca ✓ ya da ✗. Bir ay sonra bak.',ozet:kalibrasyonOzet,
  baslik:v=>v.tahmin||'Yeni tahmin',durum:v=>(v.emin?'%'+v.emin+' ':'')+(v.sonuc==='tuttu'?'✓':v.sonuc==='tutmadi'?'✗':'…'),
  form:(k,v)=>yaziAlan(k,'tahmin','Tahmin',v.tahmin,'Sonucu sonradan belli olacak somut bir şey.')+`<label class="alan">Ne kadar eminsin?</label>${secimler(k,'emin',v.emin,[50,60,70,80,90,95,99].map(x=>[x,'%'+x]))}<label class="alan">Sonuç</label>${secimler(k,'sonuc',v.sonuc,[['tuttu','✓ Tuttu'],['tutmadi','✗ Tutmadı']])}`},
 karar:{ad:'Karar günlüğü',doc:'karar',b:'3.5',acik:()=>okundu('karar'),giris:'Bir karar için beş satır ve kapı testi. Değerlendirme günü geldiğinde aç ve karşılaştır.',ozet:kararOzet,
  baslik:v=>v.karar||'Yeni karar',durum:v=>v.sonuc&&v.gerekce?kararHuku(v).kisa:(v.tarih2?(tarih(v.tarih2)<=bugun()?'değerlendir':kisa(tarih(v.tarih2))):'…'),
  form:(k,v)=>yaziAlan(k,'karar','1. Karar ne?',v.karar)
   +`<label class="alan">Kapı testi: geri dönülebilir mi?</label>${secimler(k,'kapi',v.kapi,[['iki','Geri dönülebilir'],['tek','Geri dönülemez'],['cift','Çift yönlü yapıldı']])}${v.kapi?`<p class="ipucu">${{iki:'Hızlı karar: %60 bilgiyle karar ver, dene; yanlışsa geri dön.',tek:'Yavaş karar: %80+ bilgi. Bekle, birine sor, bir gece uyu.',cift:'Kapıdan geçmeden bilgi üret: küçük, geri alınabilir bir deneme.'}[v.kapi]} <a class="ref" href="${bolum('karar','3.1')}">3.1</a></p>`:''}`
   +yaziAlan(k,'neden','2. Neden? Üç gerekçe',v.neden,'',3)+yaziAlan(k,'beklenti','3. Ne olmasını bekliyorum? Somut, yüzdeyle',v.beklenti,'',2)+yaziAlan(k,'risk','4. Ne yanlış gidebilir?',v.risk,'',2)
   +`<label class="alan">5. Ne zaman değerlendireceğim?</label><input class="yazi" type="date" data-rk="${k}" data-yol="tarih2" value="${v.tarih2||''}">`
   +((v.tarih2&&tarih(v.tarih2)<=bugun())||v.sonuc?`<h3 class="bas">Değerlendirme</h3><label class="alan">Sonuç</label>${secimler(k,'sonuc',v.sonuc,[['iyi','İyi'],['kotu','Kötü']])}<label class="alan">Gerekçe</label>${secimler(k,'gerekce',v.gerekce,[['iyi','İyiydi'],['kotu','Kötüydü']])}${v.sonuc&&v.gerekce?`<p class="sonuc"><strong>${kararHuku(v).uzun}</strong></p>`:''}${yaziAlan(k,'ogrenme','Beklediğin ne oldu, ne olmadı, neden?',v.ogrenme,'',2)}`:'')},
 elestiri:{ad:'Eleştiriyi ayrıştır',doc:'basarisizlik',b:'3.2',acik:()=>okundu('basarisizlik'),giris:'Dört adım, iki dakika: teslimatı ayır, iddiayı çıkar, test et, eyleme çevir.',ozet:elestiriOzet,
  baslik:v=>v.soz||'Yeni eleştiri',durum:v=>v.test==='hayir'?'tercih':(v.eylem||'').trim()?'eylem':'…',
  form:(k,v)=>yaziAlan(k,'soz','Ne söylendi?',v.soz,'',2)
   +`<label class="alan">1. Teslimat: nasıl söylendi? Not et, kenara koy.</label>${secimler(k,'teslimat',v.teslimat,[['nazik','Nazik'],['notr','Nötr'],['sert','Sert'],['kaba','Kaba']])}`
   +yaziAlan(k,'iddia','2. Somut iddia ne?',v.iddia,'"Berbat olmuş" iddia değil; "giriş ekranı beş saniye yükleniyor" iddia. Belirsizse sor: hangi kısmı, nasıl?')
   +`<label class="alan">3. Test edilebilir mi?</label>${secimler(k,'test',v.test,[['evet','Evet'],['kismen','Kısmen'],['hayir','Hayır']])}${v.test==='hayir'?'<p class="ipucu">Kişisel tercih: not et, geç. Birden fazla kişi derse bak.</p>':''}`
   +(v.test!=='hayir'?yaziAlan(k,'eylem','4. Doğruysa ne değişir?',v.eylem):'')},
 duygu:{ad:'Tetiklenme tablosu',doc:'duygu',b:'5.1',acik:()=>okundu('duygu')||!!program('duygu').bas,giris:'Günün en yoğun tetiklenmesi: şiddet, olay büyüklüğü, aralık, uyku. Dalga indikten sonra yaz.',ozet:duyguOzet,
  baslik:v=>v.tetik||'Yeni satır',durum:v=>v.siddet&&v.buyukluk?`${v.siddet}/${v.buyukluk}`:'…',
  form:(k,v)=>{ const on=[1,2,3,4,5,6,7,8,9,10].map(x=>[x,String(x)]), f=v.siddet&&v.buyukluk?v.siddet-v.buyukluk:null;
   return yaziAlan(k,'tetik','Tetikleyici',v.tetik,'Ne oldu? Yorumsuz, tek cümle.')
   +`<label class="alan">Şiddet: ne kadar sarstı? (1-10)</label>${secimler(k,'siddet',v.siddet,on)}<label class="alan">Olay büyüklüğü: olay gerçekte ne kadar büyük? (1-10)</label>${secimler(k,'buyukluk',v.buyukluk,on)}`
   +(f!=null&&f>=3?`<p class="ipucu">Fark ${f}: orantısız. ${baglantili(DOC.duygu,'Eski bir eşleşme olabilir (2.2).')}</p>`:'')
   +`<label class="alan">Aralık: tepki ile davranış arasına ne kadar zaman koyabildin?</label><input class="yazi" type="number" inputmode="decimal" min="0" data-rk="${k}" data-yol="aralik" data-yazi value="${v.aralik==null?'':v.aralik}">${secimler(k,'birim',v.birim||'sn',[['sn','Saniye'],['dk','Dakika']])}<p class="ipucu">Sıfır da geçerli bir kayıt.</p>`
   +`<label class="alan">O günkü uyku (saat)</label><input class="yazi" type="number" inputmode="decimal" step="0.5" min="0" max="14" data-rk="${k}" data-yol="uyku" data-yazi value="${v.uyku==null?'':v.uyku}">`; }},
 ogrenme:{ad:'Öğrenme kaydı',doc:'ogrenme',b:'2.3',acik:()=>okundu('ogrenme')||!!program('ogrenme').bas,giris:'Kitabı kapat, boş sayfaya hatırladığını yaz. Sonra dört tekrar, her biri beş dakika, kapalı kitapla.',ozet:ogrenmeOzet,
  baslik:v=>v.konu||'Yeni konu',durum:v=>{ const t=sonrakiTekrar(v); return !t?'tamam':t.gecti?`${t.i}. tekrar`:`${t.i}. tekrar ${kisa(t.t)}`; },
  form:(k,v)=>yaziAlan(k,'konu','Ne öğrendin?',v.konu)+yaziAlan(k,'bos','Boş sayfa: kitabı kapat, hatırladığını yaz',v.bos,baglantili(DOC.ogrenme,'Bakarak değil, kapalı kitapla (3.2).'),4)+yaziAlan(k,'eksik','Kontrol: neyi kaçırmışsın?',v.eksik,'',2)
   +`<h3 class="bas">Dört tekrar</h3>${TEKRAR.map(([i,g,ad])=>{ const t=ekle(tarih(v.tarih),g), y=v['t'+i]; return `<div class="tekrar-satir"><span><strong>${i}.</strong> ${ad} <span class="aciklama">${kisa(t)}</span></span>${y?`<span class="el">✓ ${kisa(tarih(y))}</span>`:`<button class="cip" data-is="tekrarYap" data-k="${k}" data-i="${i}">Yaptım</button>`}</div>`; }).join('')}<p class="ipucu">${baglantili(DOC.ogrenme,'Tekrar, yeniden okumak değil: kapalı kitapla hatırla, sonra kontrol et (2.3).')}</p>`},
 zor:{ad:'Zor konuşma',doc:'zor',b:'5.1',acik:()=>okundu('zor'),giris:'On dakika, beş adım, ikişer dakika. Sonunda çıkış cümlen hazır.',ozet:zorOzet,
  baslik:v=>v.istek||'Yeni hazırlık',durum:v=>({evet:'oldu',kismen:'kısmen',hayir:'olmadı'})[v.sonuc]||'hazırlık',
  form:(k,v)=>{ const Z=x=>baglantili(DOC.zor,x);
   return yaziAlan(k,'istek','1. Ne istiyorum? Tek şey',v.istek,Z('Haklı çıkmak cevapsa, henüz hazır değilsin (2.4).'))
   +`<label class="alan"><strong>2. Üç konuşma</strong></label>`+yaziAlan(k,'olgu','Olgu: ne oldu?',v.olgu)+yaziAlan(k,'duygu','Duygu: ne hissettim, ne hissetti?',v.duygu)+yaziAlan(k,'kimlik','Kimlik: bu olay benim hakkımda ne söylüyor diye korkuyorum?',v.kimlik,Z('Üçünü de yaz; en çok kimliği (2.1).'))
   +yaziAlan(k,'katkim','3. Katkı haritası: benim katkım',v.katkim,Z('En az iki madde (3.3).'),2)+yaziAlan(k,'katkisi','Onun katkısı',v.katkisi,'',2)
   +yaziAlan(k,'ucuncu','4. Üçüncü hikâye: açılış cümlesi',v.ucuncu,Z('Karşı taraf "evet, öyle" der mi? (3.1)'),2)
   +yaziAlan(k,'gei','5. Gözlem, etki, istek: üç cümle',v.gei,Z('Gözlem yorumsuz mu, istek somut mu? (3.2)'),3)
   +yaziAlan(k,'cikis','Çıkış cümlesi: konuşma raydan çıkarsa ne diyeceksin?',v.cikis,'',2)
   +`<h3 class="bas">Sonrasında</h3><label class="alan">İstediğin oldu mu?</label>${secimler(k,'sonuc',v.sonuc,[['evet','Oldu'],['kismen','Kısmen'],['hayir','Olmadı']])}${yaziAlan(k,'sonra','Ne çıktı? Olmadıysa neden?',v.sonra,'',2)}`; }},
 proje:{ad:'Projeler',doc:'bitirme',b:'3.1',acik:()=>okundu('bitirme')||!!program('disiplin').bas,giris:'Her proje için bitti tanımı: ana iş, ölçü, tarih. Yazıldıktan sonra kilitlenir; kapsama eklenen her şey sonraki sürüme gider.',ozet:projeOzet,
  baslik:v=>v.ad||'Yeni proje',durum:v=>(PDURUM.find(x=>x[0]===v.durum)||[0,'…'])[1],
  form:(k,v)=>{ const B=x=>baglantili(DOC.bitirme,x);
   return yaziAlan(k,'ad','Proje',v.ad)+`<label class="alan">Durum</label>${secimler(k,'durum',v.durum,PDURUM)}`
   +`<label class="alan">Sıralama: üç soru ${B('(4.2)')}</label>${[['q1','Bitişe en yakın mı? En az kalan iş'],['q2','Kullanıcısı var ya da bekliyor mu?'],['q3','Bitince en çok şey öğretecek mi?']].map(([q,t])=>`<label class="onay"><input type="checkbox" data-rk="${k}" data-yol="${q}" ${v[q]?'checked':''}><span class="kutu"></span><span>${t}</span></label>`).join('')}`
   +`<h3 class="bas">Bitti tanımı ${B('(3.1)')}</h3>`+(v.kilit?`<p><strong>1. Ana iş:</strong> ${esc(v.ana||'')}</p><p><strong>2. Ölçü:</strong> ${esc(v.olcu||'')}</p><p><strong>3. Bitiş:</strong> ${v.bitis?uzun(tarih(v.bitis)):'—'}</p><p class="ipucu">Kilitli. Kapsama eklenen her şey sonraki sürüm listesine.</p><div class="sira" style="margin-top:0"><button class="dugme ince" data-is="tanimAc" data-k="${k}">Tanımı aç</button></div>`
    :yaziAlan(k,'ana','1. Ana iş: bir yabancının yardımsız yapabileceği tek şey',v.ana,'',2)+yaziAlan(k,'olcu','2. Çalışıyor demenin ölçüsü: nasıl anlarım?',v.olcu,'',2)+`<label class="alan">3. Bitiş tarihi</label><input class="yazi" type="date" data-rk="${k}" data-yol="bitis" value="${v.bitis||''}"><div class="sira"><button class="dugme" data-is="tanimKilit" data-k="${k}">Tanımı kilitle</button></div><p class="ipucu">Yazıldıktan sonra değişmez.</p>`)
   +listeAlan(k,'sonraki','Sonraki sürüm listesi',v.sonraki,{yer:'Yeni fikir buraya'})
   +listeAlan(k,'kesme','Kesme listesi: her maddeyi dört gruba ayır',v.kesme,{yer:'Kapsamdaki bir madde',gruplar:[['olmaz','Olmazsa olmaz'],['iyi','Olsa iyi'],['sonra','Sonra'],['asla','Asla']]})+kesmeUyari(v)
   +`<h3 class="bas">Birinci kullanıcı ${B('(3.3)')}</h3>`+yaziAlan(k,'kullanici','Kim? Bir yabancı.',v.kullanici)+yaziAlan(k,'takildi','Nerede takıldı?',v.takildi,'',2)
   +`<h3 class="bas">Bitiş kaydı</h3><label class="alan">Tarih</label><input class="yazi" type="date" data-rk="${k}" data-yol="bittiTarih" value="${v.bittiTarih||''}">`+yaziAlan(k,'neBitti','Ne bitti?',v.neBitti)+`<label class="alan">Kaç kişi kullandı?</label><input class="yazi" type="number" min="0" data-rk="${k}" data-yol="kacKisi" data-yazi value="${v.kacKisi==null?'':v.kacKisi}">`; }},
 iletisim:{ad:'İletişim sayıları',doc:'iletisim',b:'5.1',ozel:true,sayfa:iletisimSayfasi,acik:()=>!!program('iletisim').bas||okundu('iletisim'),giris:'Her gün üç sayı: özetleme, kestim, durdum. Bugün ekranından, konuşmadan hemen sonra.'},
 deger:{ad:'Görüşme hazırlığı',doc:'deger',b:'5.1',acik:()=>okundu('deger'),giris:'Görüşmeden bir gün önce, bir saat: üç sayı, alternatif, kanıt, paket, açılış cümlesi.',ozet:degerOzet,
  baslik:v=>v.konu||'Yeni görüşme',durum:v=>v.tarihG?kisa(tarih(v.tarihG)):'…',
  form:(k,v)=>yaziAlan(k,'konu','Görüşme: maaş, fiyat, pay?',v.konu)+`<label class="alan">Görüşme tarihi</label><input class="yazi" type="date" data-rk="${k}" data-yol="tarihG" value="${v.tarihG||''}">`
   +`<h3 class="bas">1. Üç sayı</h3>`+yaziAlan(k,'piyasa','Piyasa aralığı: araştır',v.piyasa)+yaziAlan(k,'hedef','Hedef: üst yarı',v.hedef)+yaziAlan(k,'taban','Taban: alternatife göre',v.taban)
   +yaziAlan(k,'alternatif','2. Alternatif: bu görüşme başarısız olursa ne yapacağım? Gerçek.',v.alternatif,'',2)
   +yaziAlan(k,'kanit','3. Kanıt: son bir yılda ne yaptım, sonucu ne? Beş madde, somut.',v.kanit,ARAC.uretim.acik()?'Üretim kaydından: <a class="ref" href="#/arac/uretim">aç</a>':'Üretim kaydından.',5)
   +yaziAlan(k,'paket','4. Paket: ana sayının yanında hangi kalemler? Her biri için benim için değeri, onlar için maliyeti.',v.paket,'',3)
   +yaziAlan(k,'acilis','5. Açılış cümlesi: gerekçe, sayı, soru',v.acilis,'',2,'data-canli="kucultme"')+kucultmeKontrol(v.acilis)
   +`<h3 class="bas">Sonrasında</h3>`+yaziAlan(k,'sonra','Ne çıktı? Açılış cümlesi tuttu mu?',v.sonra,'',2)},
 belirsiz:{ad:'İki liste',doc:'belirsiz',b:'3.1',acik:()=>okundu('belirsiz'),giris:'Solda kontrolündekiler, sağda olmayanlar. Solu yap, sağı bırak. Kötü senaryoya "ve sonra?"',ozet:belirsizOzet,
  baslik:v=>v.durum||'Yeni belirsizlik',durum:v=>{ const l=dizi(v.sol); return l.length?`${l.filter(x=>x.x).length}/${l.length}`:'…'; },
  form:(k,v)=>{ const Z=x=>baglantili(DOC.belirsiz,x);
   return yaziAlan(k,'durum','Belirsizlik ne?',v.durum)
   +listeAlan(k,'sol','Sol, kontrolümde: ne yapabilirim? Somut, bu hafta',v.sol,{onay:true,yer:'Bir eylem'})
   +(dizi(v.sol).length?'':`<p class="ipucu">${Z('Sol liste boş görünüyorsa bak: en azından bekleme odasında ne yapacağın var (3.5).')}</p>`)
   +listeAlan(k,'sag','Sağ, kontrolümde değil: ne bekleyeceğim?',v.sag,{yer:'Sonuç, başkasının kararı, zaman, şans'})
   +`<p class="ipucu">Sol listeyi yap, sağ listeyi bırak. Bir takip mesajı sol; beşincisi, sağı sola kaçırmak.</p>`
   +`<h3 class="bas">Ve sonra? ${Z('(3.3)')}</h3>`+yaziAlan(k,'kotu','Kötü senaryo',v.kotu,'',2)+listeAlan(k,'vesonra','Ve sonra?',v.vesonra,{yer:'Cevabı yaz, tekrar sor'})
   +`<p class="ipucu">Üç-dört tur. Bir noktada "ve sonra hayat devam ediyor"a varıyor; o nokta, kötü senaryonun gerçek boyutu.</p>`; }},
 harita:{ad:'Sınır haritası',doc:'ustalasma',b:'3.1',acik:()=>okundu('ustalasma')||!!program('ustalasma').bas,giris:'Alanı on-on beş alt beceriye böl, her birinde nerede olduğunu işaretle. "Zorlanarak" sütunu, sınırın. Üç ayda bir yeniden çiz.',ozet:haritaOzet,
  yeni:o=>o?{alan:o.alan,beceri:dizi(o.beceri).map(b=>({m:b.m,g:b.g})),secili:o.secili}:{},yeniAd:l=>l.length?'Haritayı yeniden çiz':'Haritayı çiz',
  baslik:v=>v.alan||'Yeni harita',durum:v=>{ const b=dizi(v.beceri); return b.length?`${b.filter(x=>x.g==='zor').length} sınırda`:'…'; },
  form:(k,v)=>{ const zor=dizi(v.beceri).filter(x=>x.g==='zor').map(x=>x.m);
   return yaziAlan(k,'alan','Alan: dar, tek cümle',v.alan,'"Programlama" değil; alt alan.')
   +listeAlan(k,'beceri','Alt beceriler ve nerede olduğun',v.beceri,{yer:'Bir alt beceri',gruplar:[['yap','Yapabiliyorum'],['zor','Zorlanarak'],['yok','Yapamıyorum']]})
   +`<label class="alan">Odak: "zorlanarak" sütunundan tek beceri</label>${zor.length?`<select class="yazi" data-rk="${k}" data-yol="secili"><option value="">Seç</option>${zor.map(m=>`<option ${v.secili===m?'selected':''}>${esc(m)}</option>`).join('')}</select>`:'<p class="ipucu">Önce becerileri işaretle; odak, "zorlanarak" sütunundan seçilir.</p>'}`; }},
 uretim:{ad:'Üretim kaydı',doc:'ustalasma',b:'3.5',acik:()=>okundu('ustalasma')||!!program('ustalasma').bas,giris:'Yaptığın her iş: ne, ne kadar sürdü, sonuç, bir cümle öğrenme. İki satır, bir öğrenme; yüz satır, bir harita.',ozet:uretimOzet,
  baslik:v=>v.ne||'Yeni iş',durum:v=>v.sure?`${String(v.sure).replace('.',',')} saat`:'…',
  form:(k,v)=>yaziAlan(k,'ne','Ne?',v.ne)+`<label class="alan">Süre (saat)</label><input class="yazi" type="number" inputmode="decimal" step="0.25" min="0" data-rk="${k}" data-yol="sure" data-yazi value="${v.sure==null?'':v.sure}">`+yaziAlan(k,'sonuc','Sonuç',v.sonuc)+yaziAlan(k,'ogrenme','Bir cümle öğrenme',v.ogrenme)},
 para:{ad:'Para',doc:'para',b:'3.2',ozel:true,sayfa:paraSayfasi,acik:()=>okundu('para')||!!program('para').bas,giris:'Saat fiyatı, harcama kaydı, bekleme listesi ve yeterince sayısı, tek sayfada.'},
 kanit:{ad:'Kanıt listesi',doc:'degerler',b:'3.1',acik:()=>okundu('degerler'),giris:'Değerlerini söylemeden önce kanıta bak: son otuz günün saati, parası, dikkati. Bir saat, yılda bir.',
  ozet:()=>{ const l=kayitlar('kanit'); if(!l.length) return ''; const s=kanitSira(l[0].v).filter(x=>x.saat||x.para||x.dik).slice(0,3); return `<p style="margin-top:0">${l.length} liste. Son listede ilk üç: ${s.map(x=>x.ad).join(', ')||'henüz boş'}.</p>`; },
  baslik:()=>'Otuz günün kanıtı',durum:v=>{ const s=kanitSira(v).filter(x=>x.saat||x.para||x.dik); return s.length?s[0].ad:'…'; },
  form:(k,v)=>{ const t=v.t||{}; return `<p class="aciklama" style="margin-top:0">Son otuz gün, yaklaşık yeter: takvim, harcama${ARAC.para.acik()?' (<a class="ref" href="#/arac/para">para kaydı</a>)':''}, ekran süresi.</p>
<div class="kanit"><span></span><span>Saat</span><span>Para ₺</span><span>Dikkat</span>${KANIT_K.map(([id,ad])=>{ const r=t[id]||{}; return `<span>${ad}</span><input class="yazi kucuk" type="number" min="0" inputmode="numeric" aria-label="${ad} saat" data-rk="${k}" data-yol="t.${id}.saat" value="${r.saat==null?'':r.saat}"><input class="yazi kucuk" type="number" min="0" inputmode="numeric" aria-label="${ad} para" data-rk="${k}" data-yol="t.${id}.para" value="${r.para==null?'':r.para}"><select class="yazi kucuk" aria-label="${ad} dikkat" data-rk="${k}" data-yol="t.${id}.dikkat">${DIKKAT_S.map(([x,y])=>`<option value="${x}" ${(r.dikkat||'')===x?'selected':''}>${y}</option>`).join('')}</select>`; }).join('')}</div>${kanitSonuc(v)}`; }},
 birdaha:{ad:'Bir daha kaç kez',doc:'zaman',b:'3.2',acik:()=>okundu('zaman'),giris:'Önemli, tekrarlanan beş şey: yılda kaç kez, kaç yıl kaldı, çarp. Sonra: bu sayıyı artırmak mümkün mü?',ozet:birdahaOzet,
  baslik:v=>v.ne||'Yeni satır',durum:v=>{ const n=kalanKez(v); return n!=null?`${n.toLocaleString('tr-TR')} kez`:'…'; },
  form:(k,v)=>{ const n=kalanKez(v), y=+v.yeni>0&&+v.yil>0?Math.round(+v.yeni*+v.yil):null;
   return yaziAlan(k,'ne','Ne?',v.ne,'Senin için önemli ve tekrarlanan bir şey.')+sayiAlan(k,'siklik','Yılda kaç kez?',v.siklik)+sayiAlan(k,'yil','Kaç yıl kaldı? Kaba.',v.yil)
   +(n!=null?`<p class="buyuk-sayi" style="margin:.9rem 0 .1rem">${n.toLocaleString('tr-TR')}</p><p class="aciklama">kez kaldı, kabaca.</p>`:'')
   +sayiAlan(k,'yeni','Artırmak mümkün mü? Yılda kaç kez olabilir?',v.yeni)+(y!=null&&n!=null&&y!==n?`<p class="el">${n.toLocaleString('tr-TR')} → ${y.toLocaleString('tr-TR')}</p>`:''); }},
 katki:{ad:'Katkı envanteri',doc:'katki',b:'3.2',ozel:true,acik:()=>okundu('katki'),giris:'Beş kaynak: bilgi, zaman, dikkat, bağlantı, para. "Ne verebilirim?" sorusunun cevabı, envanter çıkarılmadan görünmüyor.',
  sayfa:a=>{ const k='katki:envanter', v=al(k,{}), dol=['bilgi','zaman','dikkat','baglanti','para'].filter(x=>(v[x]||'').trim()).length;
   return {baslik:a.ad,alt:'Katkı 3.2',geri:1,html:blok(`<b>${dol}</b>/5`,`<p style="margin-top:0">Beş satırı doldur. <a class="ref" href="${bolum('katki','3.2')}">Katkı 3.2</a></p>`
    +yaziAlan(k,'bilgi','Bilgi: bildiğin, başkasının bilmediği üç şey',v.bilgi,'Bir adım ileride olmak yetiyor.',3)+yaziAlan(k,'zaman','Zaman: haftada hangi saat?',v.zaman)
    +yaziAlan(k,'dikkat','Dikkat: hangi konuşmada?',v.dikkat)+yaziAlan(k,'baglanti','Bağlantı: birbirini tanımayan iki kişi',v.baglanti)+yaziAlan(k,'para','Para: aylık, düzenli, küçük',v.para,'Para, diğer dördünün yerine geçmiyor.'))}; }},
 oyun:{ad:'Haz envanteri',doc:'oyun',b:'3.2',ozel:true,acik:()=>okundu('oyun'),giris:'Çocukken ne yapardın, "iyiydi" anları, "ben de isterdim" dediklerin. Kolay hazları çıkar; kalan, senin hazların.',
  sayfa:a=>{ const k='oyun:envanter', v=al(k,{}), G=[['haz','Haz'],['kolay','Kolay haz']], env=['cocuk','iyiydi','isterdim'].flatMap(y=>dizi(v[y])).filter(x=>x.g!=='kolay');
   return {baslik:a.ad,alt:'Oyun ve Haz 3.2',geri:1,html:blok(`<b>${env.length}</b>haz`,`<p style="margin-top:0">Keyif aldığın şeyler unutulmuş, silinmemiş. <a class="ref" href="${bolum('oyun','3.2')}">Oyun ve Haz 3.2</a></p>`
    +listeAlan(k,'cocuk','1. Çocukken saatlerce, kimse söylemeden ne yapardın?',v.cocuk,{yer:'Bir şey',gruplar:G})
    +listeAlan(k,'iyiydi','2. Son beş yılda "iyiydi" dediğin anlar: ne yapıyordun?',v.iyiydi,{yer:'Bir an',gruplar:G})
    +listeAlan(k,'isterdim','3. Başkalarını görünce "ben de isterdim" dediklerin',v.isterdim,{yer:'Bir şey',gruplar:G})
    +'<p class="ipucu">4. Kolay hazları işaretle: kaydırma, dizi maratonu. Envantere girmiyorlar.</p>')
    +blok('Liste',env.length?`<p style="margin-top:0"><strong>5. Senin hazların</strong> <span class="aciklama">amaçsız saatin adayları</span></p>${env.map(x=>`<p style="margin:.1rem 0" class="el">${esc(x.m)}</p>`).join('')}`:'<p class="aciklama" style="margin-top:0">Henüz yok.</p>')}; }},
 iddia:{ad:'İddia ve kayıt',doc:'tanima',b:'3.1',acik:()=>okundu('tanima'),giris:'"Ben böyle biriyim" cümlesini tahmine çevir, tahmini veriye bakmadan yaz, sonra kayda bak.',ozet:iddiaOzet,
  baslik:v=>v.iddia||'Yeni iddia',durum:v=>({tuttu:'tuttu',tutmadi:'tutmadı',kosul:'koşullu'})[v.sonuc]||(v.kilit?'veri bekliyor':'…'),
  form:(k,v)=>yaziAlan(k,'iddia','1. İddia: "Ben ... biriyim"',v.iddia)
   +(v.kilit?`<p><strong>2. Tahmin:</strong> ${esc(v.tahmin||'')}</p><p class="ipucu">Kilitli: veri tahmine uydurulamaz.</p>`
     :yaziAlan(k,'tahmin','2. Tahmin: bu doğruysa kayıtta ne görmeliyim?',v.tahmin,'Somut. Veriye bakmadan önce yaz.',2)+`<div class="sira"><button class="dugme" data-is="tahminKilit" data-k="${k}" data-alan="tahmin">Tahmini kilitle</button></div>`)
   +(v.kilit?yaziAlan(k,'veri','3. Veri: hangi kayıt, ne gösteriyor?',v.veri,'Kayıtlar Defter\'in Araçlar sekmesinde.',3)+`<label class="alan">4. Karşılaştır</label>${secimler(k,'sonuc',v.sonuc,[['tuttu','Tuttu'],['tutmadi','Tutmadı'],['kosul','Şu koşulda']])}${v.sonuc==='kosul'?yaziAlan(k,'kosul','Eğer-o zaman: hangi durumda doğru?',v.kosul,baglantili(DOC.tanima,'Daha doğru tarif (4.2).')):''}`:'')},
 enerji:{ad:'Enerji haritası',doc:'tanima',b:'3.5',ozel:true,sayfa:enerjiSayfasi,acik:()=>okundu('tanima'),giris:'İki hafta, her etkinlikten sonra tek işaret: enerji verdi mi, aldı mı? Keyif değil, enerji.'},
 tahmin:{ad:'Tahmin ve sonuç',doc:'tanima',b:'3.6',acik:()=>okundu('tanima'),giris:'Önemli bir olaydan önce iki satır: ne hissedeceğim, ne kadar sürecek. Sonra karşılaştır.',ozet:tahminOzet,
  baslik:v=>v.olay||'Yeni olay',durum:v=>({abarttim:'abarttım',az:'az tahmin',tuttu:'tuttu'})[v.yon]||(v.kilit?'sonuç bekliyor':'…'),
  form:(k,v)=>yaziAlan(k,'olay','Olay',v.olay)
   +(v.kilit?`<p><strong>Tahmin:</strong> ${esc(v.his||'')}${v.sure?`; ${esc(v.sure)}`:''}</p><p class="ipucu">Kilitli: sonradan "zaten biliyordum" diyen hafıza bunu değiştiremez.</p>`
     :yaziAlan(k,'his','Bu olunca ne hissedeceğim?',v.his)+yaziAlan(k,'sure','Ne kadar sürecek?',v.sure)+`<div class="sira"><button class="dugme" data-is="tahminKilit" data-k="${k}" data-alan="his">Tahmini kilitle</button></div>`)
   +(v.kilit?yaziAlan(k,'gercek','Gerçekte ne hissettim, ne kadar sürdü?',v.gercek,'Bir hafta ya da bir ay sonra.',2)+`<label class="alan">Karşılaştır</label>${secimler(k,'yon',v.yon,[['abarttim','Abarttım'],['tuttu','Tuttu'],['az','Az tahmin ettim']])}`:'')},
 ikisoru:{ad:'İki soru',doc:'sinir',b:'3.1',acik:()=>okundu('sinir'),giris:'Her "daha iyi olmalıyım" dürtüsünde: değiştirilebilir mi, değmeye değer mi? İki cevap, dört yol.',ozet:ikisoruOzet,
  baslik:v=>v.istek||'Yeni dürtü',durum:v=>{ const y=ikiYol(v); return y?y.kisa:'…'; },
  form:(k,v)=>{ const y=ikiYol(v); return yaziAlan(k,'istek','"Daha iyi olmalıyım": ne?',v.istek)
   +`<label class="alan">1. Değiştirilebilir mi?</label>${secimler(k,'deg',v.deg,[['evet','Evet'],['zor','Zor ya da hayır']])}`
   +`<label class="alan">2. Değmeye değer mi? Hangi değere hizmet ediyor, bedeli ne?</label>${secimler(k,'deger',v.deger,[['evet','Değer'],['hayir','Değmez']])}`
   +(y?`<p class="sonuc"><strong>${y.ad}.</strong> ${baglantili(DOC.sinir,y.aciklama)}</p>`:''); }},
 kusur:{ad:'Kusur bütçesi',doc:'sinir',b:'3.4',acik:()=>okundu('sinir'),giris:'Bilerek taşıdığın iki-üç kusur. Ayrım çizgisi: bedeli kime?',ozet:kusurOzet,
  baslik:v=>v.kusur||'Yeni kusur',durum:v=>v.bedel==='ben'?'bütçede':v.bedel==='baskasi'?'iş':'…',
  form:(k,v)=>yaziAlan(k,'kusur','Kusur',v.kusur)+`<label class="alan">Bedeli kime?</label>${secimler(k,'bedel',v.bedel,[['ben','Yalnızca bana, küçük'],['baskasi','Başkasına ya da büyük']])}`
   +(v.bedel==='baskasi'?`<p class="sonuc"><strong>Bütçeye girmez.</strong> Bedelini başkası ödüyorsa kusur değil, iş: iki soruda "değer" sütununda.</p>`:v.bedel==='ben'?'<p class="ipucu">Bütçede: düzeltmeye çalışmıyorsun, suçluluk da duymuyorsun. "Evet, bende bu var."</p>':'')},
 dikkat:{ad:'Blok ve boşluk',doc:'dikkat',b:'5.1',ozel:true,sayfa:dikkatSayfasi,acik:()=>!!program('dikkat').bas||okundu('dikkat'),giris:'Dikkat programının iki sayısı: en uzun kesintisiz blok ve boşluk dakikası. Blok hedefini uygulama hesaplıyor.'}
};
function dikkatHedef(){ const p=PID.dikkat, st=program('dikkat'); if(!st.bas) return null; const n=Math.min(programGunu(p),uzunluk(p)), v=[];
  for(let i=1;i<=n;i++){ const g=gunKaydi('dikkat',i); v.push(g.m==null||g.m===''?null:+g.m); }
  const ilk=v.slice(0,14).filter(x=>x!=null&&x>0).slice(0,3), taban=ilk.length===3?Math.min(...ilk):null;
  if(n<15||taban==null) return {taban,hedef:null,n,v};
  let h=Math.min(50,taban+3), seri=0;
  for(let i=15;i<n;i++){ const x=v[i-1]; if(x!=null&&x>=h){ if(++seri>=3){ h=Math.min(50,h+5); seri=0; } } else seri=0; }
  return {taban,hedef:h,n,v}; }
function dikkatSatir(){ const d=dikkatHedef(); if(!d) return '';
  return `<p class="ipucu">${d.hedef?`Bugünün blok hedefi <strong>${d.hedef} dakika</strong>: taban ${d.taban}, üç başarılı günde +5, tavan 50. Bir blokta iki kez çöküyorsan geri in.`:d.taban!=null?`Taban çizgisi <strong>${d.taban} dakika</strong>: ilk üç ölçümün en düşüğü. Blok protokolü 15. gün başlıyor.`:'Bu günlerde yalnızca ölç: dikkatinin ilk kez kaydığı dakika. Zorlama yok; ilk üç ölçümün en düşüğü taban olacak.'} <a class="ref" href="#/arac/dikkat">Kayıt</a></p>`; }
function dikkatSayfasi(a){
  const d=dikkatHedef(); if(!d) return {baslik:a.ad,geri:1,html:blok('',`<p>Dikkat programı başlayınca burada günlük blok ve boşluk sayıları birikir.</p>`)};
  const rows=[]; for(let i=1;i<=d.n;i++){ const g=gunKaydi('dikkat',i); rows.push([i,g.m,g.b]); }
  const mx=Math.max(50,...rows.map(r=>+r[1]||0)), W=Math.max(rows.length,1)*8, yy=x=>60-Math.round(58*x/mx);
  const bar=`<svg viewBox="0 0 ${W} 60" preserveAspectRatio="none" style="width:100%;height:72px;display:block" role="img" aria-label="Günlük en uzun blok">${rows.map((r,i)=>r[1]?`<rect x="${i*8+1}" y="${yy(r[1])}" width="6" height="${60-yy(r[1])}" fill="var(--kalem)" opacity=".85"/>`:'').join('')}${d.hedef?`<line x1="0" x2="${W}" y1="${yy(d.hedef)}" y2="${yy(d.hedef)}" stroke="var(--kenar)" stroke-width="1.5" stroke-dasharray="4 3"/>`:''}</svg>`;
  return {baslik:a.ad,alt:'Dikkat 3.2 ve 5.1',geri:1,html:blok('Hedef',`<p style="margin-top:0">${d.hedef?`Bugünün blok hedefi <strong>${d.hedef} dakika</strong>. Taban ${d.taban}; üç başarılı günde +5, tavan 50.`:d.taban!=null?`Taban çizgisi <strong>${d.taban} dakika</strong>. Blok protokolü 15. gün başlıyor.`:'İlk günler yalnızca ölç: dikkatinin ilk kez kaydığı dakika.'} <a class="ref" href="${bolum('dikkat','3.2')}">3.2</a></p>${bar}<p class="ipucu">Çubuk: günün en uzun bloğu. Kesikli çizgi: bugünün hedefi.</p>`)
   +blok('Kayıt',`<div class="tablo" tabindex="0" role="region" aria-label="Blok kaydı"><table><thead><tr><th>Gün</th><th>Blok (dk)</th><th>Boşluk (dk)</th></tr></thead><tbody>${rows.slice().reverse().map(r=>`<tr><td>${r[0]}</td><td>${r[1]==null||r[1]===''?'—':r[1]}</td><td>${r[2]==null||r[2]===''?'—':r[2]}</td></tr>`).join('')}</tbody></table></div><p class="ipucu">Sayılar Bugün ekranından giriliyor. Altı hafta sonra iki sütuna bak: hissettiğin ilerlemeden daha dürüst.</p>`)};
}
function aracListesi(){ return Object.entries(ARAC).sort((x,y)=>(OKW[x[1].doc]??99)-(OKW[y[1].doc]??99)).map(([id,a])=>{ const ac=a.acik(), n=a.ozel?null:kayitlar(id).length;
  const dh=id==='dikkat'&&ac?dikkatHedef():null;
  return blok(ac?(n!=null?`<b>${n}</b>kayıt`:(dh&&dh.hedef?`<b>${dh.hedef}</b>dk`:'')):'Kilitli',`<h3 class="bas" style="margin-top:0">${ac?`<a href="#/arac/${id}">${esc(a.ad)}</a>`:esc(a.ad)}</h3><p class="aciklama" style="margin-bottom:0">${ac?esc(a.giris):`${esc(docAd(a.doc))} okununca açılır (Hafta ${OKW[a.doc]}).`}</p>`); }).join(''); }
function incelemeBlogu(){ const a=incelemeBlogu0(), kd=ARAC.karar.acik()?kayitlar('karar').filter(({v})=>v.tarih2&&tarih(v.tarih2)<=bugun()&&!v.sonuc):[],
    od=ARAC.ogrenme.acik()?kayitlar('ogrenme').filter(({v})=>{ const t=sonrakiTekrar(v); return t&&t.gecti; }):[],
    bd=ARAC.para.acik()?kayitlar('bekleme').filter(({v})=>v.durum==='bekliyor'&&beklemeBitis(v)<=bugun()):[];
  if(!kd.length&&!od.length&&!bd.length) return a;
  const kh=kd.slice(0,3).map(({k,v})=>`<div style="margin-bottom:.9rem"><strong>Karar: ${esc(v.karar||'adsız')}</strong><br><span class="aciklama">Değerlendirme günü geldi: beklediğin ne oldu?</span><div class="sira" style="margin-top:.3rem"><button class="cip" data-is="kayitAc" data-a="karar" data-k="${k}">Değerlendir</button></div></div>`).join('')
   +od.slice(0,4).map(({k,v})=>{ const t=sonrakiTekrar(v); return `<div style="margin-bottom:.9rem"><strong>Tekrar: ${esc(v.konu||'adsız konu')}</strong><br><span class="aciklama">${t.i}. tekrar: kapalı kitapla hatırla, sonra kontrol et.</span><div class="sira" style="margin-top:.3rem"><button class="cip" data-is="tekrarYap" data-k="${k}" data-i="${t.i}">Yaptım</button><button class="cip pasif" data-is="kayitAc" data-a="ogrenme" data-k="${k}">Aç</button></div></div>`; }).join('')
   +bd.slice(0,4).map(({k,v})=>`<div style="margin-bottom:.9rem"><strong>Bekleme doldu: ${esc(v.ne)}</strong><br><span class="aciklama">${v.tur==='buyuk'?'Otuz':'İki'} gün geçti. Hâlâ istiyor musun?</span><div class="sira" style="margin-top:.3rem"><button class="cip" data-is="beklemeSonuc" data-k="${k}" data-v="aldim">İstiyorum, aldım</button><button class="cip" data-is="beklemeSonuc" data-k="${k}" data-v="vazgectim">Vazgeçtim</button></div></div>`).join('');
  return a?a.replace(/<\/div><\/section>$/,kh+'</div></section>'):blok('Tekrar',kh); }
V.arac=r=>{
  const a=ARAC[r.a]; if(!a) return {baslik:'Araç',geri:1,html:blok('',`<p>Bu araç yok.</p>`)};
  if(!a.acik()) return {baslik:a.ad,geri:1,html:blok('Kilitli',`<p>${esc(docAd(a.doc))} okununca açılır (Hafta ${OKW[a.doc]}).</p><div class="sira">${dugme('Metni aç','#/oku/'+a.doc)}</div>`)};
  if(r.b==='yeni'&&!a.ozel){ const k=`kayit:${r.a}:${Date.now().toString(36)}`; koy(k,yeniKayit(r.a),{sessiz:true}); acikKayit=k; history.replaceState(null,'','#/arac/'+r.a); }
  if(a.ozel) return a.sayfa(a);
  const l=kayitlar(r.a);
  let h=blok(`<b>${l.length}</b>kayıt`,`<p style="margin-top:0">${esc(a.giris)} <a class="ref" href="${bolum(a.doc,a.b)}">${esc(docAd(a.doc))} ${a.b}</a></p><div class="sira"><button class="dugme dolu" data-is="aracYeni" data-a="${r.a}">${a.yeniAd?a.yeniAd(l):'Yeni kayıt'}</button></div>`);
  if(l.length) h+=blok('Özet',a.ozet());
  h+=l.map(({k,v})=>blok(kisa(tarih(v.tarih)),acikKayit===k?`${a.form(k,v)}<div class="sira"><button class="dugme" data-is="aracAc" data-k="${k}">Kapat</button><button class="dugme ince" data-is="aracSil" data-k="${k}">Sil</button></div>`
    :`<button class="satir-dugme" data-is="aracAc" data-k="${k}"><span>${md(a.baslik(v))}</span><span class="durum">${esc(a.durum(v))}</span></button>`)).join('');
  return {baslik:a.ad,alt:`${docAd(a.doc)} ${a.b}`,geri:1,html:h};
};

/* ================= BAŞLAT ================= */
yukle(); temaUygula(); yaziUygula(); kaliciIste();
if(!location.hash) history.replaceState(null,'','#/bugun');
ciz(); sonrasi({sessiz:true}); senkron.kur();
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&!yaziyor()) ciz(true); });
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&!window.ONIZLEME){
  let istendi=false;
  navigator.serviceWorker.register('sw.js').then(reg=>{ reg.addEventListener('updatefound',()=>{ const w=reg.installing; if(w) w.addEventListener('statechange',()=>{ if(w.state==='installed'&&navigator.serviceWorker.controller) bildiri('Yeni sürüm hazır.',{ad:'Yenile',f:()=>{ istendi=true; w.postMessage('atla'); }}); }); }); }).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(istendi) location.reload(); });
}
window.__defter={gunIsleri,rehberMod,senkron,yedekGerekli,yedekDurum,kayitBoyutu,senkronBoyut,SENKRON_SINIR,kenarNot,hecele,icsUret,siradakiMuhur,muhurIler,hatirlaSay,istatistik,kanitSira,ikiYol,sayiOku,saatFiyati,kucultmeKontrol,sonrakiTekrar,ARAC,kayitlar,dikkatHedef,yonerge,duyguGrup,PID,temiz,dizi,depo,istatistik,zincir,cizelge,simdi,sayim,kurallar,MUHUR,PROG,koy,al,V,rota,ciz};
})();
