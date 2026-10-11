'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {rankPatchRecommendations,rankProductDesignPatchRecommendations} from '../recommendation-rules';

// Rank alternatives first, then fill any remaining spaces with the current set.
// This runs only on explicit refresh/context reset, never on every placed patch.
function patchBatch(context,designs,previousIds=[]){
  const selected=new Set(context.paidSignature.split(','));
  const candidates=context.eligiblePatches.filter(p=>!selected.has(String(p.id))&&p.release_status!=='coming_soon');
  const source=context.patches.find(p=>String(p.id)===String(context.anchorId));
  const previous=new Set(previousIds);
  const rank=items=>[
    ...rankProductDesignPatchRecommendations(designs,[...selected],items,15),
    ...(source?rankPatchRecommendations(source,items,context.rules,15):[]),
  ];
  const seen=new Set();
  return [...rank(candidates.filter(p=>!previous.has(String(p.id)))),...rank(candidates)]
    .filter(p=>{const id=String(p.id);if(seen.has(id))return false;seen.add(id);return true;})
    .slice(0,15).map(p=>String(p.id));
}

export function useSuggestions({productId,placed,patches,eligiblePatches,rules}){
  const paidSignature=[...new Set(placed.filter(p=>!p.gift).map(p=>String(p.patchId)))].sort().join(',');
  const anchorId=placed.filter(p=>!p.gift).at(-1)?.patchId||'';
  const key=`${productId}:${paidSignature}`;
  const latest=useRef(null);
  latest.current={key,productId,paidSignature,anchorId,patches,eligiblePatches,rules};
  const [snapshot,setSnapshot]=useState({productId:'',signature:'',designs:[]});
  const [patchSnapshot,setPatchSnapshot]=useState({productId:'',ids:[],anchorId:''});
  const snapshotRef=useRef(snapshot);snapshotRef.current=snapshot;
  const patchRef=useRef(patchSnapshot);patchRef.current=patchSnapshot;
  const patchRevision=useRef(0),seedPending=useRef(false);
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  // Session-only metadata cache, bounded and short-lived for stock changes.
  const designCache=useRef(new Map());
  const controller=useRef(null),generation=useRef(0),inFlight=useRef(''),previous=useRef({productId:'',signature:''});

  const refreshPatches=useCallback(()=>{
    const context=latest.current;
    if(!context.paidSignature)return;
    patchRevision.current++;seedPending.current=false;
    const designs=snapshotRef.current.productId===context.productId?snapshotRef.current.designs:[];
    const old=patchRef.current.productId===context.productId?patchRef.current.ids:[];
    const next={productId:context.productId,ids:patchBatch(context,designs,old),anchorId:context.anchorId};
    patchRef.current=next;setPatchSnapshot(next);
  },[]);

  const refreshDesigns=useCallback(async({force=false}={})=>{
    const context=latest.current;
    if(!context.paidSignature||inFlight.current===context.key)return;
    controller.current?.abort();
    const abort=new AbortController();controller.current=abort;
    const token=++generation.current,revision=patchRevision.current;
    const maySeed=seedPending.current;
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
      // Enrich the first batch once. Keep every already displayed card, even if
      // the customer has since added it; later design refreshes are independent.
      if(maySeed&&seedPending.current&&revision===patchRevision.current){
        seedPending.current=false;
        const old=patchRef.current;
        const ids=[...new Set([...old.ids,...patchBatch(context,data.items)])].slice(0,15);
        const next={...old,ids};patchRef.current=next;setPatchSnapshot(next);
      }
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
      patchRevision.current++;seedPending.current=Boolean(paidSignature);
      const next={productId,ids:paidSignature?patchBatch(latest.current,[]):[],anchorId};
      patchRef.current=next;setPatchSnapshot(next);
      setSnapshot({productId,signature:'',designs:[]});setError('');
    }
    if(paidSignature&&(changedProduct||removed||!old.signature||interrupted))refreshDesigns();
  },[productId,paidSignature,refreshDesigns]);
  useEffect(()=>()=>{controller.current?.abort();generation.current++;},[]);

  const recommendations=useMemo(()=>{
    if(!paidSignature||patchSnapshot.productId!==productId)return [];
    const byId=new Map(eligiblePatches.filter(p=>p.release_status!=='coming_soon').map(p=>[String(p.id),p]));
    // Deliberately do not filter placed IDs: duplicate patches are supported.
    return patchSnapshot.ids.map(id=>byId.get(id)).filter(Boolean);
  },[patchSnapshot,productId,Boolean(paidSignature),eligiblePatches]);
  return {
    productDesigns:snapshot.productId===productId?snapshot.designs:[],recommendations,loading,error,
    refreshPatches,refreshDesigns,
    anchor:patches.find(p=>String(p.id)===String(patchSnapshot.anchorId)),
    canRefreshPatches:Boolean(paidSignature&&eligiblePatches.some(p=>p.release_status!=='coming_soon')),
    canRefreshDesigns:Boolean(paidSignature&&!loading&&(error||snapshot.productId!==productId||snapshot.signature!==paidSignature)),
  };
}
