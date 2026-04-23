import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LoginPage from './user/LoginPage'
import MessageBox from './shared/components/MessageBox'
import { SimpleTabLayout } from './shared/layout/SimpleTabLayout'

function App() {
  // 프로덕션(WAR 배포)에서는 /pcms/ 아래에서 동작하므로 basename 지정
  const basename = import.meta.env.PROD ? '/pcms' : '/'

  const router = createBrowserRouter([
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/*',
      element: <SimpleTabLayout />,
    }
  ], { basename })

  return (
    <>
      <MessageBox />
      <RouterProvider router={router} />
    </>
  )
}

export default App
