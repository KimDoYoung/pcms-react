import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/auth/LoginPage'
import DiaryPage from './pages/diary/DiaryPage'
import DiaryRegisterPage from './pages/diary/DiaryRegisterPage'
import JangbiPage from './pages/jangbi/JangbiPage'
import JangbiNewPage from './pages/jangbi/JangbiNewPage'
import JangbiViewPage from './pages/jangbi/JangbiViewPage'
import JangbiEditPage from './pages/jangbi/JangbiEditPage'
import BoardsPage from './pages/board/BoardsPage'
import PostsPage from './pages/board/PostsPage'
import PostNewPage from './pages/board/PostNewPage'
import PostViewPage from './pages/board/PostViewPage'
import PostEditPage from './pages/board/PostEditPage'
import ApNodePage from './pages/apnode/ApNodePage'
import UserInfoPage from './pages/user/UserInfoPage'
import SettingsPage from './pages/user/SettingsPage'
import Calendar1Page from './pages/calendar/Calendar1Page'
import AnniversaryPage from './pages/calendar/AnniversaryPage'
import Practice01Flex from './pages/practice/Practice01Flex'
import MessageBox from './components/MessageBox'

function App() {
  // 프로덕션(WAR 배포)에서는 /pcms/ 아래에서 동작하므로 basename 지정
  const basename = import.meta.env.PROD ? '/pcms' : '/'

  return (
    <BrowserRouter basename={basename}>
      <MessageBox />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/user-info" element={<UserInfoPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/calendar" element={<Calendar1Page />} />
        <Route path="/calendar/anniversary" element={<AnniversaryPage />} />
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
        <Route path="/apnode" element={<ApNodePage />} />
        <Route path="/practice/tailwindcss" element={<Practice01Flex />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
