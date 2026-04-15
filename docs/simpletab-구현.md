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
| 라우트 관리 | **중앙 집중화 (`routeConfig.ts`)** | 페이지 추가/수정 시 한 곳만 수정하도록 개선 (리팩토링) |

---

## 탭 시스템 핵심 동작 원리

이 탭 시스템이 유기적으로 동작하는 핵심 원리는 **브라우저 URL과 탭 상태의 동기화**에 있습니다. 사용자가 클릭하거나 `navigate`를 호출해 URL이 바뀌면, 오케스트레이터가 이를 감지하여 탭 상태를 업데이트하고 화면에 반영합니다.

### 1. 핵심 파일: `SimpleTabLayout.tsx` (오케스트레이터)
전체 탭 시스템의 "두뇌" 역할을 합니다.
* **URL 감지 (`useTabSync.ts`)**: 브라우저의 URL(`location.pathname`, `location.search`)이 변경될 때마다 이를 감지하여 탭 상태를 업데이트하는 로직을 분리하여 관리합니다.
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
* **Toolbar**는 `routeConfig.ts`의 설정을 기반으로 메뉴를 동적으로 생성합니다.

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

## 파일 구성 (리팩토링 후)

모든 레이아웃 및 탭 관련 파일은 `frontend/src/shared/layout/` 폴더에 응집되어 있습니다.

| 파일 | 역할 |
|------|------|
| `routeConfig.ts` | **(핵심)** 모든 라우트, 라벨, 컴포넌트, 메뉴 그룹 설정 (Single Source of Truth) |
| `useTabSync.ts` | URL 변화를 감지하여 탭 상태를 동기화하는 커스텀 훅 |
| `SimpleTabLayout.tsx` | 전체 레이아웃 컨테이너 (Toolbar + TabBar + Content) |
| `SimpleTabBar.tsx` | 탭 헤더 UI (드래그 앤 드롭, 컨텍스트 메뉴 포함) |
| `Toolbar.tsx` | 상단 네비게이션 메뉴 (routeConfig 기반 동적 생성) |
| `tabStore.ts` | 탭 목록 및 활성 탭 상태 관리 (Zustand) |
| `TabContext.tsx` | 이중 Toolbar 방지 및 탭 파라미터 전달용 Context |
| `useTabParams.ts` | 탭 내부에서 동적 경로 파라미터를 읽는 훅 |
| `useTabReturnPath.ts` | 목록으로 돌아갈 때 검색 조건을 포함한 경로 계산 훅 |

---

## routeConfig.ts (중앙 설정)

```typescript
export const APP_ROUTES: AppRoute[] = [
  { path: '/', label: '🏠 홈', Component: HomePage },
  { path: '/diary', label: '🔍 일지찾기', Component: DiaryPage, menuGroup: '📖 일지' },
  { path: '/diary/:id', label: '📖 일지보기', Component: DiaryViewPage, isDynamic: true },
  // ... 모든 경로를 이곳에서 관리
];
```

---

## SimpleTabLayout.tsx

```tsx
export function SimpleTabLayout() {
  const tabs = useTabStore(state => state.tabs)
  const activeTabId = useTabStore(state => state.activeTabId)

  useTabSync() // URL ↔ 탭 동기화

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <SimpleTabBar />
      <div className="flex-1 overflow-auto bg-gray-50">
        <TabContext.Provider value={{ isInsideTab: true }}>
          {tabs.map((tab) => {
            const found = findRoute(tab.path)
            if (!found) return null
            const { Component } = found
            return (
              <TabRouteParamsContext.Provider key={tab.id} value={found.params}>
                <div style={{ display: activeTabId === tab.id ? 'block' : 'none' }}>
                  <Component />
                </div>
              </TabRouteParamsContext.Provider>
            )
          })}
        </TabContext.Provider>
      </div>
    </div>
  )
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
