/**
 * 한자 변환 실습 페이지
 *
 * 에디터에서 한글 단어를 선택 → 툴바의 漢 버튼 클릭 → 한자 선택 → 교체 확인
 */
import { useState } from 'react'
import Toolbar from '@/shared/components/Toolbar'
import ContentEditor from '@/shared/components/editor/ContentEditor'

export default function Practice03Hanja() {
  const [content, setContent] = useState('<p>운명이라는 단어를 선택해서 漢 버튼을 눌러보세요.</p>')

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">한자 변환 실습</h1>
        <p className="text-sm text-gray-500 mb-6">
          에디터에서 한글 단어를 드래그로 선택한 뒤 툴바의 <strong>漢</strong> 버튼을 클릭하세요.
        </p>
        <ContentEditor value={content} onChange={setContent} minHeight="300px" />
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">현재 HTML 출력:</p>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">{content}</pre>
        </div>
      </main>
    </div>
  )
}
