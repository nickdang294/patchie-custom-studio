export const DEFAULT_HALLOWEEN_FEATURES={
  spider:true,
  cobwebs:true,
  bats:true,
  fireworks:true
};

export const normalizeHalloweenFeatures=value=>({...DEFAULT_HALLOWEEN_FEATURES,...(value||{})});
