'use client';
import {useRef,useState,useEffect} from 'react';
import './loading-image.css';
export default function LoadingImage({className='',alt='',src,...props}){
 const image=useRef(null),[state,setState]=useState('loading');
 useEffect(()=>{setState(image.current?.complete&&image.current?.naturalWidth?'ready':'loading');},[src]);
 return <span className={`sf-loading-image ${className}`} data-state={state} aria-busy={state==='loading'}>{state==='loading'&&<span className="sf-image-placeholder" aria-hidden="true">✦</span>}{state==='error'&&<span className="sf-image-error" role="status">Chưa tải được ảnh</span>}<img {...props} ref={image} src={src} alt={alt} onLoad={()=>setState('ready')} onError={()=>setState('error')}/></span>;
}
