'use client';

export default function BatsBurst({ enabled=true, trigger=0 }) {
  if(!enabled||!trigger)return null;
  return <div key={trigger} className="bats-burst" aria-hidden="true">
    {Array.from({length:7},(_,index)=><span key={index} className={`bat bat-${index+1}`}>🦇</span>)}
  </div>;
}
