import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AllNotifications from './pages/AllNotifications'
import PriorityInbox from './pages/PriorityInbox'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<AllNotifications />} />
        <Route path="/priority" element={<PriorityInbox />} />
      </Routes>
    </Layout>
  )
}
