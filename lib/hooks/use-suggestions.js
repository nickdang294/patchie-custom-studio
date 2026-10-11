'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {rankPatchRecommendations,rankProductDesignPatchRecommendations} from '../recommendation-rules';

// One snapshot for desktop and mobile. Additions wait for an explicit refresh;
// removals and product changes invalidate the snapshot immediately.
export function useSuggestions({productId,placed,patches,eligiblePatches,rules}){
  const paidSignature=[...new Set(placed.filter(p=>!p.gift).map(p=>String(p.patchId)))].sort().join(',');
  const selectedSignature=[...new Set(placed.map(p=>String(p.patchId)))].sort().join(',');
  const anchorId=placed.filter(p=>!p.gift).at(-1)?.patchId||'';
  const key=`${productId}:${paidSignature}`;
  const latest=useRef(null);
  latest.current={key,productId,paidSignature,selectedSignature,anchorId,patches,eligiblePatches,rules};
  const [snapshot,setSnapshot]=useState({productId:'',signature:'',designs:[],ruleIds:[],anchorId:''});
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const controller=useRef(null),generation=useRef(0),inFlight=useRef(''),previous=useRef({productId:'',signature:''});
  const request=useCallback(async()=>{
    const context=latest.current;
    if(!context.paidSignature||inFlight.current===context.key)return;
    controller.current?.abort();
    const abort=new AbortController();controller.current=abort;
    const token=++generation.current;inFlight.current=context.key;
    const source=context.patches.find(p=>String(p.id)===String(context.anchorId));
    const selected=new Set(context.selectedSignature.split(','));
    const candidates=context.eligiblePatches.filter(p=>!selected.has(String(p.id))&&p.release_status!=='coming_soon');
    const ruleIds=source?rankPatchRecommendations(source,candidates,context.rules,15).map(p=>String(p.id)):[];
    setSnapshot(old=>({...old,productId:context.productId,ruleIds,anchorId:context.anchorId}));
    setLoading(true);setError('');
    try{
      const response=await fetch(`/api/product-designs?productId=${encodeURIComponent(context.productId)}&patchIds=${encodeURIComponent(context.paidSignature)}`,{cache:'no-store',signal:abort.signal});
      if(!response.ok)throw new Error('Không tải được mẫu phối.');
      const data=await response.json();
      if(!Array.isArray(data.items))throw new Error('Dữ liệu mẫu phối không hợp lệ.');
      if(token!==generation.current||latest.current.key!==context.key)return;
      setSnapshot({productId:context.productId,signature:context.paidSignature,designs:data.items,ruleIds,anchorId:context.anchorId});
    }catch(e){if(e.name!=='AbortError'&&token===generation.current&&latest.current.key===context.key)setError('Chưa tải được mẫu phối. Bạn thử lại nhé.');}
    finally{if(token===generation.current){inFlight.current='';setLoading(false);}}
  },[]);
  useEffect(()=>{
    const old=previous.current,ids=paidSignature?paidSignature.split(','):[];
    const removed=old.signature.split(',').filter(Boolean).some(id=>!ids.includes(id));
    const changedProduct=old.productId!==productId;
    previous.current={productId,signature:paidSignature};
    const interrupted=Boolean(inFlight.current);
    if(interrupted){controller.current?.abort();generation.current++;inFlight.current='';setLoading(false);}
    if(!paidSignature){setSnapshot({productId,signature:'',designs:[],ruleIds:[],anchorId:''});setError('');return;}
    if(changedProduct||removed||!old.signature||interrupted){
      if(changedProduct||removed)setSnapshot({productId,signature:'',designs:[],ruleIds:[],anchorId:''});
      request();
    }
  },[productId,paidSignature,request]);
  useEffect(()=>()=>{controller.current?.abort();generation.current++;},[]);
  const recommendations=useMemo(()=>{
    if(!paidSignature||snapshot.productId!==productId)return [];
    const selected=new Set(selectedSignature.split(','));
    const candidates=eligiblePatches.filter(p=>!selected.has(String(p.id))&&p.release_status!=='coming_soon');
    const byId=new Map(candidates.map(p=>[String(p.id),p]));
    const fromDesign=rankProductDesignPatchRecommendations(snapshot.designs,[...selected],candidates,15);
    const seen=new Set();
    return [...fromDesign,...snapshot.ruleIds.map(id=>byId.get(id)).filter(Boolean)].filter(p=>{const id=String(p.id);if(seen.has(id))return false;seen.add(id);return true;}).slice(0,15);
  },[snapshot,productId,paidSignature,selectedSignature,eligiblePatches]);
  return {productDesigns:snapshot.productId===productId?snapshot.designs:[],recommendations,loading,error,refresh:request,
    anchor:patches.find(p=>String(p.id)===String(snapshot.anchorId)),
    canRefresh:Boolean(paidSignature&&!loading&&(error||snapshot.productId!==productId||snapshot.signature!==paidSignature))};
}
