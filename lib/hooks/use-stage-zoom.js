'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
// Continuous transforms do not re-render the storefront. React is notified only
// when the zoomed/unzoomed controls need to change.
export function useStageZoom(stage){
  const zoom=useRef({scale:1,x:0,y:0}),frame=useRef(0),zoomed=useRef(false);
  const [,setZoomed]=useState(false);
  const setZoom=useCallback(next=>{
    Object.assign(zoom.current,typeof next==='function'?next(zoom.current):next);
    const value=zoom.current.scale>1;
    if(value!==zoomed.current){zoomed.current=value;setZoomed(value);}
    if(!frame.current)frame.current=requestAnimationFrame(()=>{
      frame.current=0;const node=stage.current,layer=node?.querySelector('.stage-zoom-layer'),v=zoom.current;
      if(layer)layer.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.scale})`;
      node?.classList.toggle('is-zoomed',v.scale>1);
    });
  },[stage]);
  useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
  return [zoom.current,setZoom];
}
