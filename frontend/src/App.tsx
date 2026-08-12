import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LoginPage from './user/LoginPage'
import MessageBox from './shared/components/MessageBox'
import { SimpleTabLayout } from './shared/layout/SimpleTabLayout'
import PostPublicViewPage from './domain/board/PostPublicViewPage'

function App() {
  // 프로덕션(WAR 배포)에서는 /pcms/ 아래에서 동작하므로 basename 지정
  const basename = import.meta.env.PROD ? '/pcms' : '/'

  const router = createBrowserRouter([
    {
      path: '/login',
      element: <LoginPage />,
    },
    // post url 공유용 공개 뷰. 예: /posts/html/171, /posts/markdown/171
    // contentType을 :contentType 동적 세그먼트로 두면 내부 탭 라우트 /posts/:id/edit (예: /posts/171/edit)와
    // 경로 모양이 같아져 라우터가 이 라우트로 잘못 매칭한다 (id="edit"로 파싱되어 백엔드 Long 변환 오류 발생).
    // contentType을 리터럴로 고정해 라우트 충돌을 없앤다.
    {
      path: '/posts/html/:id',
      element: <PostPublicViewPage />,
    },
    {
      path: '/posts/markdown/:id',
      element: <PostPublicViewPage />,
    },
    {
      path: '/posts/text/:id',
      element: <PostPublicViewPage />,
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
