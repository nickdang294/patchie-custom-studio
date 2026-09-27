'use client';

import { useEffect, useRef, useState } from 'react';

export default function PumpkinSpider({ enabled=true, page='studio', reactionKey='' }) {
  const spiderRef=useRef(null);
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
      if(!spiderRef.current||media.matches)return;
      const root=document.documentElement;
      const maxScroll=Math.max(1,root.scrollHeight-window.innerHeight);
      const progress=Math.min(1,Math.max(0,window.scrollY/maxScroll));
      spiderRef.current.style.setProperty('--pumpkin-spider-y',`${19+progress*58}vh`);
      spiderRef.current.style.setProperty('--pumpkin-spider-tilt',`${Math.sin(progress*Math.PI*5)*5}deg`);
    };
    let frame=0;
    const onScroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(updatePosition);};
    updatePosition();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);media.removeEventListener?.('change',updateMotion);};
  },[enabled]);

  if(!enabled)return null;
  return <div ref={spiderRef} className={`pumpkin-spider pumpkin-spider-${page}${reducedMotion?' pumpkin-spider-reduced':''}${reacting?' pumpkin-spider-reacting':''}`} aria-hidden="true">
    <span className="pumpkin-spider-web"></span>
    <span className="pumpkin-spider-spark pumpkin-spider-spark-a">✦</span>
    <span className="pumpkin-spider-spark pumpkin-spider-spark-b">✧</span>
    <span className="pumpkin-spider-note">trick? ✦</span>
    <svg className="pumpkin-spider-art" viewBox="0 0 126 126" role="presentation">
      <path className="pumpkin-spider-leg" d="M42 72 15 61 6 46M38 82 11 82 4 71M43 91 19 103 10 117M84 72l27-11 9-15M88 82l27 0 7-11M83 91l24 12 9 14"/>
      <path className="pumpkin-spider-leg leg-inner" d="M47 67 28 49 25 35M79 67l19-18 3-14M47 97l-18 15M79 97l18 15"/>
      <path className="pumpkin-spider-body" d="M34 73c0-19 12-31 29-31s29 12 29 31c0 21-12 35-29 35S34 94 34 73Z"/>
      <path className="pumpkin-spider-ridge" d="M49 48c-6 16-6 35 0 52M62 44c-4 19-4 39 0 59M75 48c6 16 6 35 0 52"/>
      <path className="pumpkin-spider-stem" d="M57 43c-3-9 3-15 11-13 5 1 7-4 5-8"/>
      <path className="pumpkin-spider-face" d="M45 72c0-8 8-13 18-13s18 5 18 13c0 9-8 14-18 14s-18-5-18-14Z"/>
      <circle className="pumpkin-spider-eye" cx="56" cy="70" r="3.5"/><circle className="pumpkin-spider-eye" cx="70" cy="70" r="3.5"/>
      <path className="pumpkin-spider-smile" d="M58 78c4 3 7 3 11 0"/>
      <path className="pumpkin-spider-patch" d="M55 89h15v13H55Z"/>
      <path className="pumpkin-spider-patch-stitch" d="M58 93h9M58 97h9"/>
    </svg>
  </div>;
}
