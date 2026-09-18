import Sidebar from '../../components/Sidebar'
export default function AdminLayout({children}:{children:React.ReactNode}){return <div className="shell"><Sidebar role="ADMIN"/><main className="main">{children}</main></div>}
