'use client';

import { useEffect, useRef, useState } from 'react';

export default function PumpkinSpider({ enabled=true, page='studio', reactionKey='', patchCount=0 }) {
  const spiderRef=useRef(null),dragRef=useRef(null),manualRef=useRef(false);
  const [reducedMotion,setReducedMotion]=useState(false),[reacting,setReacting]=useState(false);

  useEffect(()=>{
    if(!enabled||reactionKey==='')return undefined;
    setReacting(true);
    const timer=setTimeout(()=>setReacting(false),900);
    return()=>clearTimeout(timer);
  },[enabled,reactionKey]);

  useEffect(()=>{
    if(!enabled)return undefined;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion=()=>setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener?.('change',updateMotion);
    const updatePosition=()=>{
      if(!spiderRef.current)return;
      if(!media.matches&&!manualRef.current){
        const root=document.documentElement;
        const maxScroll=Math.max(1,root.scrollHeight-window.innerHeight);
        const progress=Math.min(1,Math.max(0,window.scrollY/maxScroll));
        spiderRef.current.style.setProperty('--pumpkin-spider-y',`${19+progress*58}vh`);
        spiderRef.current.style.setProperty('--pumpkin-spider-tilt',`${Math.sin(progress*Math.PI*5)*5}deg`);
      }
    };
    let frame=0;
    const onScroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(updatePosition);};
    updatePosition();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);media.removeEventListener?.('change',updateMotion);};
  },[enabled]);

  const startDrag=event=>{
    if(!spiderRef.current)return;
    event.preventDefault();
    const rect=spiderRef.current.getBoundingClientRect();
    manualRef.current=true;
    dragRef.current={pointerId:event.pointerId,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};
    event.currentTarget.setPointerCapture?.(event.pointerId);
    spiderRef.current.style.setProperty('--pumpkin-spider-left',`${rect.left}px`);
    spiderRef.current.style.setProperty('--pumpkin-spider-y',`${rect.top}px`);
    spiderRef.current.classList.add('is-floating','is-dragging');
  };
  const moveDrag=event=>{
    if(!dragRef.current||dragRef.current.pointerId!==event.pointerId||!spiderRef.current)return;
    const {width,height}=spiderRef.current.getBoundingClientRect();
    const left=Math.min(Math.max(8,event.clientX-dragRef.current.offsetX),window.innerWidth-width-8);
    const top=Math.min(Math.max(8,event.clientY-dragRef.current.offsetY),window.innerHeight-height-8);
    spiderRef.current.style.setProperty('--pumpkin-spider-left',`${left}px`);
    spiderRef.current.style.setProperty('--pumpkin-spider-y',`${top}px`);
    spiderRef.current.style.setProperty('--pumpkin-spider-tilt','0deg');
  };
  const endDrag=event=>{
    if(!dragRef.current||dragRef.current.pointerId!==event.pointerId)return;
    const spider=spiderRef.current;
    if(spider){
      spider.releasePointerCapture?.(event.pointerId);
      spider.classList.remove('is-dragging');
    }
    dragRef.current=null;
  };

  if(!enabled)return null;
  const growth=Math.min(4,Math.max(0,Number(patchCount)||0));
  const notes=['Chọn thêm patch để tui lớn lên','tui lớn lên xíu rùi nè, thêm nữa i','tui thành thanh niên ùi, sắp trưởng thành ùi','còn 1 patch nữa là tui max level rùi đó','TUI MAX LEVEL RÙIIII'];
  return <div ref={spiderRef} style={{'--spider-growth-width':`${growth*7}px`,'--spider-growth-height':`${growth*9}px`}} className={`pumpkin-spider pumpkin-spider-${page}${reducedMotion?' pumpkin-spider-reduced':''}${reacting?' pumpkin-spider-reacting':''}`} role="button" tabIndex={0} aria-label="Kéo nhện bí ngô tự do trong màn hình" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
    <span className="pumpkin-spider-web"></span>
    <span className="pumpkin-spider-spark pumpkin-spider-spark-a">✦</span>
    <span className="pumpkin-spider-spark pumpkin-spider-spark-b">✧</span>
    <span className="pumpkin-spider-note" aria-hidden="true">{notes[growth]}</span>
    <svg className="pumpkin-spider-art" viewBox="0 0 126 126" role="presentation">
      <path className="pumpkin-spider-leg" d="M42 72 15 61 6 46M38 82 11 82 4 71M43 91 19 103 10 117M84 72l27-11 9-15M88 82l27 0 7-11M83 91l24 12 9 14"/>
      <path className="pumpkin-spider-leg leg-inner" d="M47 67 28 49 25 35M79 67l19-18 3-14M47 97l-18 15M79 97l18 15"/>
      <ellipse className="pumpkin-spider-abdomen" cx="63" cy="43" rx="29" ry="27"/>
      <path className="pumpkin-spider-body" d="M39 77c0-16 10-25 24-25s24 9 24 25c0 18-10 29-24 29S39 95 39 77Z"/>
      <path className="pumpkin-spider-face" d="M45 72c0-8 8-13 18-13s18 5 18 13c0 9-8 14-18 14s-18-5-18-14Z"/>
      <circle className="pumpkin-spider-eye" cx="56" cy="70" r="3.5"/><circle className="pumpkin-spider-eye" cx="70" cy="70" r="3.5"/>
      <path className="pumpkin-spider-smile" d="M58 78c4 3 7 3 11 0"/>
      <circle className="pumpkin-spider-cheek" cx="50" cy="77" r="3"/><circle className="pumpkin-spider-cheek" cx="76" cy="77" r="3"/>
    </svg>
  </div>;
}
