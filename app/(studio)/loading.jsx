import {LoadingAnimation} from '../components/studio-chrome';

export default function Loading() {
  return <div className="studio-workspace-loading" role="status" aria-live="polite" aria-busy="true"><LoadingAnimation/></div>;
}
