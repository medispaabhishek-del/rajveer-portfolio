(function(){
var $=function(s,c){return(c||document).querySelector(s)},$$=function(s,c){return[].slice.call((c||document).querySelectorAll(s))};

/* Nav */
var nav=$('#nav'),burger=$('#burger'),links=$('#links');
addEventListener('scroll',function(){nav.classList.toggle('s',scrollY>40)},{passive:true});
burger.addEventListener('click',function(){var o=links.classList.toggle('open');burger.setAttribute('aria-expanded',o)});
$$('a',links).forEach(function(a){a.addEventListener('click',function(){links.classList.remove('open');burger.setAttribute('aria-expanded','false')})});

/* Staggered scroll reveal.
   [data-stagger] groups stagger by position; [data-batch] items stagger by how many appear together. */
$$('[data-stagger]').forEach(function(g){$$('.rv',g).forEach(function(el,i){el.style.setProperty('--d',(i*0.12)+'s')})});
var io=new IntersectionObserver(function(es){
  var n=0;
  es.forEach(function(e){
    if(!e.isIntersecting)return;
    var el=e.target;
    if(el.hasAttribute('data-batch'))el.style.setProperty('--d',(n++*0.1)+'s');
    el.classList.add('in');io.unobserve(el);
    var d=parseFloat(el.style.getPropertyValue('--d'))||0;
    setTimeout(function(){el.style.setProperty('--d','0s')},(d+1)*1000+100); /* so hover effects never lag */
  });
},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.rv').forEach(function(el){io.observe(el)});

/* Counters */
var ns=$$('.n');
if(ns.length){
  var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){count(e.target);co.unobserve(e.target)}})},{threshold:.6});
  ns.forEach(function(n){co.observe(n)});
}
function count(el){
  var to=parseFloat(el.dataset.to),dec=+el.dataset.dec||0,suf=el.dataset.suf||'',t0=null,dur=2200;
  function f(t){t0=t0||t;var p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,4);el.textContent=(to*e).toFixed(dec)+suf;if(p<1)requestAnimationFrame(f)}
  requestAnimationFrame(f);
}

/* Skill meters (About page): fill up when scrolled into view */
var fl=$$('.fill');
if(fl.length){
  var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.style.width=e.target.dataset.v+'%';fo.unobserve(e.target)}})},{threshold:.6});
  fl.forEach(function(f){fo.observe(f)});
}

/* Testimonials (Home page only) */
var track=$('#track');
if(track){
  var slides=$$('.slide',track),dots=$('#dots'),cur=0,timer;
  slides.forEach(function(_,i){var d=document.createElement('i');d.addEventListener('click',function(){go(i,true)});dots.appendChild(d)});
  var go=function(i,user){cur=(i+slides.length)%slides.length;track.style.transform='translateX(-'+cur*100+'%)';$$('i',dots).forEach(function(d,k){d.classList.toggle('on',k===cur)});if(user)play()};
  var play=function(){clearInterval(timer);timer=setInterval(function(){go(cur+1)},6000)};
  $('#prev').addEventListener('click',function(){go(cur-1,true)});
  $('#next').addEventListener('click',function(){go(cur+1,true)});
  go(0);play();
}

/* Brand marquee (Home page only): duplicate content for a seamless loop */
var mq=$('#mq');if(mq)mq.innerHTML+=mq.innerHTML;
})();
