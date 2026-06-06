/**
 * animbgInject.mjs — inject a "virtual mouse" into animated background effects.
 *
 * Many htmlhub effects only animate in response to a moving cursor (mousemove /
 * pointermove / clientX / clientY). In a rendered video there is no real user,
 * so those effects would sit nearly static. This module appends a small script
 * that dispatches synthetic mouse/pointer-move events along a random smooth
 * (Lissajous) curve, so such effects animate on their own.
 *
 * Determinism: the loop is driven by requestAnimationFrame, which Remotion
 * hijacks during render, so motion advances deterministically per frame within
 * a single render. The curve's phases/frequencies are randomized once at load,
 * giving a different (but per-render-consistent) path each time.
 */

const MARK = 'virtual-mouse (auto-injected)';

// Effects that read any of these are considered mouse-driven.
const MOUSE_RE = /mousemove|pointermove|onmousemove|mousedown|\bmouseX\b|\bmouseY\b|clientX|clientY/i;

const SNIPPET = `
<script>
/* ${MARK}: drive synthetic mousemove/pointermove along a random smooth curve so
   effects needing a moving cursor animate without a real user. rAF-driven for
   deterministic per-frame motion during Remotion render. */
(function(){
  function W(){return window.innerWidth||document.documentElement.clientWidth||1920;}
  function H(){return window.innerHeight||document.documentElement.clientHeight||1080;}
  var ax=0.0003+Math.random()*0.0006, ay=0.0003+Math.random()*0.0006;
  var px=Math.random()*Math.PI*2, py=Math.random()*Math.PI*2;
  function pos(t){return {x:(0.5+0.42*Math.sin(t*ax+px))*W(), y:(0.5+0.42*Math.sin(t*ay+py))*H()};}
  var last=pos(0);
  function fire(t){
    var p=pos(t), dx=p.x-last.x, dy=p.y-last.y;
    var targets=[window,document,document.body,document.documentElement];
    var cs=document.getElementsByTagName('canvas');
    for(var i=0;i<cs.length;i++) targets.push(cs[i]);
    ['mousemove','pointermove'].forEach(function(type){
      targets.forEach(function(tg){
        if(!tg||!tg.dispatchEvent) return;
        var ev;
        try{ev=new MouseEvent(type,{clientX:p.x,clientY:p.y,screenX:p.x,screenY:p.y,bubbles:true,cancelable:true,view:window});}
        catch(e){ev=document.createEvent('MouseEvents');ev.initMouseEvent(type,true,true,window,0,p.x,p.y,p.x,p.y,false,false,false,false,0,null);}
        try{Object.defineProperty(ev,'pageX',{configurable:true,value:p.x});Object.defineProperty(ev,'pageY',{configurable:true,value:p.y});}catch(e){}
        try{Object.defineProperty(ev,'movementX',{configurable:true,value:dx});Object.defineProperty(ev,'movementY',{configurable:true,value:dy});}catch(e){}
        tg.dispatchEvent(ev);
      });
    });
    last=p;
  }
  function loop(){var t=(window.performance&&performance.now)?performance.now():Date.now();fire(t);requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
})();
</script>
`;

/** True if the effect HTML reacts to mouse/pointer movement. */
export function needsVirtualMouse(html) {
  return MOUSE_RE.test(html);
}

/**
 * Return html with the virtual-mouse script appended, if the effect needs it.
 * Idempotent (skips if already injected) and a no-op for effects that don't
 * read mouse input.
 */
export function injectVirtualMouse(html) {
  if (!needsVirtualMouse(html)) return html;
  if (html.indexOf(MARK) !== -1) return html;
  const idx = html.toLowerCase().lastIndexOf('</body>');
  if (idx !== -1) return html.slice(0, idx) + SNIPPET + html.slice(idx);
  return html + SNIPPET;
}
