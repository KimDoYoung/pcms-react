# SimpleTab 커스텀 탭 시스템 구현

## 개요

Toolbar 메뉴 클릭 시 페이지가 교체되는 대신, 브라우저 탭처럼 여러 페이지를 동시에 열어두고 전환할 수 있는 탭 시스템.
외부 라이브러리 없이 현재 스택(Zustand + Tailwind)만으로 구현한다.

---

## 핵심 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 이중 Toolbar 방지 | `TabContext` + early return | 기존 페이지 파일 **무수정** |
| 탭 콘텐츠 렌더링 | 전체 렌더링 후 CSS `display:none` | 작업 상태(검색 필터 등) 보존 — Option B(unmount) 시도했으나 탭 전환 시 상태 초기화로 UX 저하 확인 |
| 탭 상태 | Zustand `tabStore` | 기존 authStore/messageStore 패턴 동일 |
| URL 동기화 | 구현 완료 | 브라우저 URL과 활성 탭 상태를 항상 일치시켜 탭 전환 오류 방지 |

---

## 탭 시스템 핵심 동작 원리

이 탭 시스템이 유기적으로 동작하는 핵심 원리는 **브라우저 URL과 탭 상태의 동기화**에 있습니다. 사용자가 클릭하거나 `navigate`를 호출해 URL이 바뀌면, 오케스트레이터가 이를 감지하여 탭 상태를 업데이트하고 화면에 반영합니다.

### 1. 핵심 파일: `SimpleTabLayout.tsx` (오케스트레이터)
전체 탭 시스템의 "두뇌" 역할을 합니다.
* **URL 감지 (`useEffect`)**: 브라우저의 URL(`location.pathname`, `location.search`)이 변경될 때마다 이를 감지합니다.
* **탭 자동 생성/전환**: 
  * 새로운 URL로 이동하면 `openTab`을 호출해 새 탭을 만듭니다.
  * 이미 열려 있는 탭의 경로라면 `activateTab`으로 탭만 전환합니다.
  * **인-탭 네비게이션**: `/diary` 탭에서 `/diary/1`로 이동하는 것과 같이 하위 경로로 이동할 때는 탭을 새로 만들지 않고 기존 탭의 내부 정보(`path`, `params`)만 업데이트합니다.
* **상태 보존**: 모든 탭의 컴포넌트를 미리 렌더링해두고, 활성화되지 않은 탭은 CSS의 `display: none`으로 숨깁니다. 덕분에 다른 탭에 갔다 와도 입력했던 검색어나 스크롤 위치가 그대로 유지됩니다.

### 2. 데이터 저장소: `tabStore.ts` (상태 관리)
Zustand를 사용하여 탭들의 목록과 현재 어떤 탭이 활성화되어 있는지를 관리합니다.
* 각 탭 아이템(`TabItem`)은 단순한 이름뿐만 아니라, **현재 탭의 전체 경로(`path`)와 검색 조건(`search`)**을 상태로 들고 있습니다.

### 3. UI 컴포넌트: `SimpleTabBar.tsx` & `Toolbar.tsx`
상단에 보이는 탭 바와 메뉴를 담당합니다.
* 탭이나 메뉴를 클릭했을 때 단순히 상태만 변경하는 것이 아니라, **저장된 `path + search`를 사용해 실제 브라우저 URL을 변경(`navigate`)**합니다. 이 변경을 `SimpleTabLayout.tsx`가 감지하여 최종적으로 탭 상태를 동기화합니다.

---

## 레이아웃 구조

```
Before:
  <Toolbar /> + React Router → 페이지 전체 교체

After:
  <Toolbar />          ← 전역 단 1개 (탭 밖)
  <SimpleTabBar />     ← 탭 헤더 (탭 목록 + X 닫기 + context menu + drag & drop)
  <TabContent />       ← 활성 탭 페이지 렌더링 (비활성은 display:none)
```

---

## 파일 구성

### 생성 파일

| 파일 | 역할 |
|------|------|
| `frontend/src/shared/store/tabStore.ts` | 탭 상태 Zustand store |
| `frontend/src/shared/context/TabContext.tsx` | 이중 Toolbar 방지용 Context |
| `frontend/src/shared/components/SimpleTabBar.tsx` | 탭 헤더 UI |
| `frontend/src/shared/components/SimpleTabLayout.tsx` | 전체 레이아웃 컨테이너 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/src/shared/components/Toolbar.tsx` | isInsideTab early return + Link → openTab 교체 |
| `frontend/src/App.tsx` | 22개 Route → `/login` + `/*` 2개로 축소 |

---

## tabStore.ts

```typescript
export interface TabItem {
  id: string        // 고유 키 = path (예: '/diary')
  label: string     // 탭 표시 이름 (예: '🔍 일지찾기')
  path: string      // 경로
  closable: boolean // 홈 탭은 false
}

interface TabState {
  tabs: TabItem[]
  activeTabId: string
  openTab(item)       // 이미 열려있으면 activateTab만 호출
  closeTab(tabId)     // 홈('/') 닫기 불가. 닫힌 탭이 활성 탭이면 왼쪽 탭으로 이동
  activateTab(tabId)
  closeTabsToRight(tabId)  // 기준 탭 오른쪽 closable 탭 전부 닫기
  closeTabsToLeft(tabId)   // 기준 탭 왼쪽 closable 탭 전부 닫기
  closeAllTabs()           // closable 탭 전부 닫기
  reorderTabs(fromId, toId) // 드래그 앤 드롭 순서 변경 (홈 탭 앞으로 이동 불가)
}

// 초기 상태: 홈 탭 1개
tabs: [{ id: '/', label: '🏠 홈', path: '/', closable: false }]
```

---

## SimpleTabBar.tsx

### 탭 헤더 스펙

- 고정 너비: `w-36` (144px)
- 라벨: `truncateTabLabel()` — 아이콘 + 최대 5글자 + `…`
- 전체 이름은 `title` 속성으로 tooltip 표시
- 활성 탭: `bg-white border-gray-200 text-blue-600 font-medium shadow-sm`
- 비활성 탭: `bg-gray-50 text-gray-500 hover:bg-gray-200`

### X 버튼

- 오른쪽 여백: `marginRight: 2px`
- hover: `hover:bg-red-100 hover:text-red-500`

### Context Menu (우클릭)

마우스 위치에 팝업. 해당 방향에 닫을 탭이 없으면 비활성화(회색).

| 항목 | 동작 |
|------|------|
| 오른쪽 탭 모두 닫기 | `closeTabsToRight(tabId)` |
| 왼쪽 탭 모두 닫기 | `closeTabsToLeft(tabId)` |
| 모두 닫기 | `closeAllTabs()` |

### Drag & Drop

- 홈 탭: `draggable=false` (항상 첫 번째 고정)
- 드래그 중인 탭: `opacity-40`
- 드롭 대상 탭: 왼쪽 파란 테두리 + 파란 배경 표시
- drop 시 `reorderTabs(fromId, toId)` 호출

---

## SimpleTabLayout.tsx

```tsx
export function SimpleTabLayout() {
  const { tabs, activeTabId } = useTabStore()
  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <SimpleTabBar />
      <div className="flex-1 overflow-auto bg-gray-50">
        <TabContext.Provider value={{ isInsideTab: true }}>
          {tabs.map((tab) => {
            const Page = TAB_PAGE_MAP[tab.path]
            if (!Page) return null
            return (
              <div key={tab.id} style={{ display: activeTabId === tab.id ? 'block' : 'none' }}>
                <Page />
              </div>
            )
          })}
        </TabContext.Provider>
      </div>
    </div>
  )
}
```

### TAB_PAGE_MAP

```typescript
const TAB_PAGE_MAP: Record<string, ComponentType> = {
  '/': HomePage,
  '/diary': DiaryPage,
  '/diary/register': DiaryRegisterPage,
  '/calendar': Calendar1Page,
  '/calendar/anniversary': AnniversaryPage,
  '/jangbi': JangbiPage,
  '/jangbi/new': JangbiNewPage,
  '/apnode': ApNodePage,
  '/boards': BoardsPage,
  '/posts': PostsPage,
  '/posts/new': PostNewPage,
  '/movie/collection': MoviePage,
  '/movie/review': MovieReviewPage,
  '/movie/hdd': HddPage,
  '/user-info': UserInfoPage,
  '/settings': SettingsPage,
  '/practice/tailwindcss': Practice01Flex,
  '/practice/hooks': Practice02Hooks,
  '/practice/hanja': Practice03Hanja,
}
```

---

## 렌더링 방식 결정 기록

| 방식 | 결과 |
|------|------|
| Option A: `display:none` (전체 마운트 유지) | **채택** — 탭 전환 시 작업 상태 완전 보존 |
| Option B: 활성 탭만 렌더링 (unmount) | **기각** — 탭 전환 시 검색 필터 등 상태 초기화. "다시 작업해야 하는 느낌"으로 탭의 효용 저하 |

---

## V1 이후 확장 포인트

- [x] 페이지 내부 navigate (예: 일지 상세보기 클릭) → 현재 탭 내용물 교체 (In-tab Navigation)
- [x] URL ↔ 활성 탭 동기화 (검색 파라미터 포함)
- [ ] 탭 상태 sessionStorage 저장 (새로고침 후 복원)
- [ ] 탭 최대 개수 제한 및 경고
