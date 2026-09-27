'use client';

import { useEffect, useRef, useState } from 'react';

export default function GhostCat({ enabled=true, page='studio', reactionKey='' }) {
  const catRef=useRef(null);
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
      if(!catRef.current||media.matches)return;
      const root=document.documentElement;
      const maxScroll=Math.max(1,root.scrollHeight-window.innerHeight);
      const progress=Math.min(1,Math.max(0,window.scrollY/maxScroll));
      catRef.current.style.setProperty('--ghost-cat-y',`${18+progress*58}vh`);
      catRef.current.style.setProperty('--ghost-cat-tilt',`${Math.sin(progress*Math.PI*4)*4}deg`);
    };
    let frame=0;
    const onScroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(updatePosition);};
    updatePosition();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);media.removeEventListener?.('change',updateMotion);};
  },[enabled]);

  if(!enabled)return null;
  return <div ref={catRef} className={`ghost-cat ghost-cat-${page}${reducedMotion?' ghost-cat-reduced':''}${reacting?' ghost-cat-reacting':''}`} aria-hidden="true">
    <span className="ghost-cat-web"></span>
    <span className="ghost-cat-spark ghost-cat-spark-a">✦</span>
    <span className="ghost-cat-spark ghost-cat-spark-b">✧</span>
    <span className="ghost-cat-note">booo ✦</span>
    <svg className="ghost-cat-art" viewBox="0 0 104 112" role="presentation">
      <path className="ghost-cat-tail" d="M78 78c18 4 20-17 7-20-6-1-9 4-5 8" />
      <path className="ghost-cat-body" d="M18 79V39l13 9 21-14 21 14 13-9v40c0 18-15 27-34 27S18 97 18 79Z" />
      <path className="ghost-cat-ear" d="M27 46 21 22l21 15M72 37l21-15-6 24" />
      <circle className="ghost-cat-eye" cx="40" cy="59" r="4" />
      <circle className="ghost-cat-eye" cx="64" cy="59" r="4" />
      <path className="ghost-cat-mouth" d="M48 72c4 4 8 4 12 0" />
      <path className="ghost-cat-whisker" d="M35 70 17 66M35 75 16 77M69 70l18-4M69 75l19 2" />
      <path className="ghost-cat-patch" d="M48 83h12v11H48Z" />
      <path className="ghost-cat-patch-stitch" d="M51 86h6M51 90h6" />
    </svg>
  </div>;
}
