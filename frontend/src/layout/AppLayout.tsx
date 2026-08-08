import { Outlet } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { useSession } from '../context/SessionContext'
import { Footer } from './Footer'
import { NavBar } from './NavBar'

export function AppLayout() {
  const { sessionId, error } = useSession()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-[60px] pb-6 sm:px-6 md:pt-[77px]">
        {!sessionId && error ? <ErrorState message={error} /> : <Outlet />}
      </main>
      <Footer />
    </div>
  )
}
