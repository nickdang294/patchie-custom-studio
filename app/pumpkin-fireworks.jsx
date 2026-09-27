'use client';

export default function PumpkinFireworks({ enabled=true, trigger=false }) {
  if(!enabled||!trigger)return null;
  return <div className="pumpkin-fireworks" aria-hidden="true">
    <div className="pumpkin-fireworks-face">🎃</div>
    {Array.from({length:12},(_,index)=><i key={index} className={`pumpkin-fireworks-ray ray-${index+1}`}>✦</i>)}
    <span className="pumpkin-fireworks-pop">YAY!</span>
  </div>;
}
