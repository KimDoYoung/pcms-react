import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './home/HomePage'
import LoginPage from './user/LoginPage'
import DiaryPage from './domain/diary/DiaryPage'
import DiaryRegisterPage from './domain/diary/DiaryRegisterPage'
import DiaryViewPage from './domain/diary/DiaryViewPage'
import JangbiPage from './domain/jangbi/JangbiPage'
import JangbiNewPage from './domain/jangbi/JangbiNewPage'
import JangbiViewPage from './domain/jangbi/JangbiViewPage'
import JangbiEditPage from './domain/jangbi/JangbiEditPage'
import BoardsPage from './domain/board/BoardsPage'
import PostsPage from './domain/board/PostsPage'
import PostNewPage from './domain/board/PostNewPage'
import PostViewPage from './domain/board/PostViewPage'
import PostEditPage from './domain/board/PostEditPage'
import ApNodePage from './domain/apnode/ApNodePage'
import UserInfoPage from './user/UserInfoPage'
import SettingsPage from './user/SettingsPage'
import Calendar1Page from './domain/calendar/Calendar1Page'
import AnniversaryPage from './domain/calendar/AnniversaryPage'
import Practice01Flex from './practice/Practice01Flex'
import Practice02Hooks from './practice/Practice02Hooks'
import Practice03Hanja from './practice/Practice03Hanja'
import MessageBox from './shared/components/MessageBox'

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
        <Route path="/diary/:id" element={<DiaryViewPage />} />
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
        <Route path="/practice/hooks" element={<Practice02Hooks />} />
        <Route path="/practice/hanja" element={<Practice03Hanja />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
