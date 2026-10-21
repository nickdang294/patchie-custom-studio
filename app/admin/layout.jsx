import '../secondary-pages.css';
import '../size-guide.css';
import './admin-workspace.css';
import {Suspense} from 'react';
import AdminNavigation from './admin-navigation';
export default function PageLayout({children}) {return <div className="admin-workspace"><Suspense fallback={<aside className="admin-global-nav"/>}><AdminNavigation/></Suspense><div className="admin-workspace-main"><Suspense fallback={<p>Đang tải quản trị…</p>}>{children}</Suspense></div></div>;}
