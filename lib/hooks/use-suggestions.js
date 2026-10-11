'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

// Product-design suggestions only. Patch suggestions were removed from the
// customer flow, so this hook no longer ranks or caches patch alternatives.
export function useSuggestions({productId,placed}){
  const paidSignature=[...new Set(placed.filter(item=>!item.gift).map(item=>String(item.patchId)))].sort().join(',');
  const key=`${productId}:${paidSignature}`;
  const latest=useRef(null);
  latest.current={key,productId,paidSignature};
  const [snapshot,setSnapshot]=useState({productId:'',signature:'',designs:[]});
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const designCache=useRef(new Map());
  const controller=useRef(null),generation=useRef(0),inFlight=useRef(''),previous=useRef({productId:'',signature:''});

  const refreshDesigns=useCallback(async({force=false}={})=>{
    const context=latest.current;
    if(!context.paidSignature||inFlight.current===context.key)return;
    controller.current?.abort();
    const abort=new AbortController();controller.current=abort;
    const token=++generation.current;
    inFlight.current=context.key;setLoading(true);setError('');
    try{
      const cached=designCache.current.get(context.key);
      let data;
      if(!force&&cached&&Date.now()-cached.time<60000){
        data={items:cached.items};
      }else{
        const response=await fetch(`/api/product-designs?productId=${encodeURIComponent(context.productId)}&patchIds=${encodeURIComponent(context.paidSignature)}`,{cache:'no-store',signal:abort.signal});
        if(!response.ok)throw new Error('Không tải được mẫu phối.');
        data=await response.json();
        if(!Array.isArray(data.items))throw new Error('Dữ liệu mẫu phối không hợp lệ.');
        if(token!==generation.current||latest.current.key!==context.key)return;
        designCache.current.delete(context.key);
        designCache.current.set(context.key,{time:Date.now(),items:data.items});
        if(designCache.current.size>20)designCache.current.delete(designCache.current.keys().next().value);
      }
      if(token!==generation.current||latest.current.key!==context.key)return;
      setSnapshot({productId:context.productId,signature:context.paidSignature,designs:data.items});
    }catch(e){
      if(e.name!=='AbortError'&&token===generation.current&&latest.current.key===context.key)setError('Chưa tải được mẫu phối. Bạn thử lại nhé.');
    }finally{if(token===generation.current){inFlight.current='';setLoading(false);}}
  },[]);

  useEffect(()=>{
    const old=previous.current,ids=paidSignature?paidSignature.split(','):[];
    const removed=old.signature.split(',').filter(Boolean).some(id=>!ids.includes(id));
    const changedProduct=old.productId!==productId;
    previous.current={productId,signature:paidSignature};
    const interrupted=Boolean(inFlight.current);
    if(interrupted){controller.current?.abort();generation.current++;inFlight.current='';setLoading(false);}
    if(!paidSignature||changedProduct||removed||!old.signature){
      setSnapshot({productId,signature:'',designs:[]});setError('');
    }
    if(paidSignature&&(changedProduct||removed||!old.signature||interrupted))refreshDesigns();
  },[productId,paidSignature,refreshDesigns]);
  useEffect(()=>()=>{controller.current?.abort();generation.current++;},[]);

  return {
    productDesigns:snapshot.productId===productId?snapshot.designs:[],loading,error,refreshDesigns,
    canRefreshDesigns:Boolean(paidSignature&&!loading&&(error||snapshot.productId!==productId||snapshot.signature!==paidSignature)),
  };
}
