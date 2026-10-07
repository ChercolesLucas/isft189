import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

function MainLayout() { return <div className="flex min-h-screen bg-slate-100"><Sidebar /><div className="min-w-0 flex-1"><Header /><main className="mx-auto max-w-[1440px] p-5 sm:p-8 lg:p-10"><Outlet /></main></div></div> }
export default MainLayout
