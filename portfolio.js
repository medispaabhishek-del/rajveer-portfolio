(function(){
var $=function(s,c){return(c||document).querySelector(s)},$$=function(s,c){return[].slice.call((c||document).querySelectorAll(s))};
var TX=SITE.data.text,CATS={yt:TX['portfolio.tab.yt'],reels:TX['portfolio.tab.reels'],cg:TX['portfolio.tab.cg']};
var P=SITE.data.projects;
var grid=$('#pgrid'),tabs=$$('.tab'),lb=$('#lb'),cur='all',vis=[],idx=0,last,token=0;
var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function thumb(p){return SITE.thumb(p)}

P.forEach(function(p,i){
  var v=SITE.hasVideo(p),b=document.createElement('button');b.type='button';b.className='pc rv'+(v?' has-vid':'');b.dataset.cat=p.cat;b.dataset.i=i;b.setAttribute('data-batch','');
  b.innerHTML='<span class="th">'+thumb(p)+'<span class="tagc">'+esc(CATS[p.cat])+'</span>'+(v?'<span class="play"><svg class="ic"><use href="#i-play"/></svg></span><span class="vbadge">Watch Video</span>':'')+'</span><span class="info"><h3>'+esc(p.title)+'</h3><p>'+esc(p.desc)+'</p></span>';
  b.addEventListener('click',function(){open(b)});
  grid.appendChild(b);
});

/* Filtering: fade out, then reorder smoothly (FLIP) and fade in new cards */
function apply(f,animate){
  var my=++token,cards=$$('.pc',grid);
  var leaving=cards.filter(function(c){return !c.classList.contains('hide')&&f!=='all'&&c.dataset.cat!==f});
  var run=function(){
    if(my!==token)return;
    var first=new Map();
    cards.forEach(function(c){c.getAnimations().forEach(function(a){a.cancel()});if(!c.classList.contains('hide'))first.set(c,c.getBoundingClientRect())});
    vis=[];
    cards.forEach(function(c){var m=f==='all'||c.dataset.cat===f;c.classList.toggle('hide',!m);if(m){c.classList.add('in');c.style.setProperty('--d','0s');vis.push(c)}});
    if(!animate||reduced)return;
    vis.forEach(function(c,k){
      var a=first.get(c),b=c.getBoundingClientRect();
      if(a){var dx=a.left-b.left,dy=a.top-b.top;if(dx||dy)c.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:750,easing:'cubic-bezier(.2,.7,.2,1)'})}
      else c.animate([{opacity:0,transform:'translateY(22px) scale(.96)',filter:'blur(8px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:800,delay:k*70,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
    });
  };
  if(animate&&!reduced&&leaving.length){leaving.forEach(function(c){c.animate([{opacity:1,filter:'blur(0)'},{opacity:0,filter:'blur(6px)',transform:'scale(.96)'}],{duration:300,easing:'ease',fill:'forwards'})});setTimeout(run,300)}else run();
}
function select(f,animate){
  cur=f;tabs.forEach(function(t){var on=t.dataset.f===f;t.classList.toggle('on',on);t.setAttribute('aria-selected',on)});
  apply(f,animate);
}
tabs.forEach(function(t){t.addEventListener('click',function(){if(t.dataset.f===cur)return;select(t.dataset.f,true);history.replaceState(null,'','#'+t.dataset.f)})});
var h=location.hash.slice(1);
vis=$$('.pc',grid);
if(h&&CATS[h])select(h,false);

/* Lightbox + video player (shared with the Home page, see player.js) */
function open(card){window.RMPlayer.open(vis.map(function(c){return P[c.dataset.i]}),vis.indexOf(card),card)}
})();
