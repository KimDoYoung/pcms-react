import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DiaryPage from './pages/DiaryPage'
import DiaryRegisterPage from './pages/DiaryRegisterPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>`1`
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/diary/register" element={<DiaryRegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
