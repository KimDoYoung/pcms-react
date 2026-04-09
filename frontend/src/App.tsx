import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DiaryPage from './pages/DiaryPage'
import DiaryRegisterPage from './pages/DiaryRegisterPage'
import JangbiPage from './pages/JangbiPage'
import JangbiNewPage from './pages/JangbiNewPage'
import JangbiViewPage from './pages/JangbiViewPage'
import JangbiEditPage from './pages/JangbiEditPage'
import BoardsPage from './pages/BoardsPage'
import PostsPage from './pages/PostsPage'
import PostNewPage from './pages/PostNewPage'
import PostViewPage from './pages/PostViewPage'
import PostEditPage from './pages/PostEditPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/diary/register" element={<DiaryRegisterPage />} />
        <Route path="/jangbi" element={<JangbiPage />} />
        <Route path="/jangbi/new" element={<JangbiNewPage />} />
        <Route path="/jangbi/:id" element={<JangbiViewPage />} />
        <Route path="/jangbi/:id/edit" element={<JangbiEditPage />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/new" element={<PostNewPage />} />
        <Route path="/posts/:id" element={<PostViewPage />} />
        <Route path="/posts/:id/edit" element={<PostEditPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
