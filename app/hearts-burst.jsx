'use client';

export default function HeartsBurst({ enabled=true, trigger=0, patchCount=1 }) {
  if(!enabled||!trigger)return null;
  const level=Math.min(6,Math.max(1,Number(patchCount)||1));
  const count=Math.min(18,5+level*2);
  const style={'--heart-opacity':String(.24+level*.08),'--heart-size':`${14+level*2}px`,'--heart-scale':String(1+level*.12)};
  return <div key={trigger} className="hearts-burst" aria-hidden="true">
    {Array.from({length:count},(_,index)=><span key={index} className={`heart heart-${index+1}`} style={style}>♥</span>)}
  </div>;
}
