# front end 설치

## 개요

- frontend의 기술스택에 맞춰서 설치하는 순서

## 작업 순서 1 : vite react project생성
- frontend폴더에서 작업할 것

```bash
# 1. Vite 프로젝트 생성 (React + TypeScript + SWC)
npm create vite@latest . -- --template react-ts-swc

# 2. 기본 의존성 설치
npm install

# 3. 라우팅 및 상태 관리 (README 기술 스택 기준)
npm install react-router-dom@7 axios @tanstack/react-query zustand

# 4. 폼 관리 및 유효성 검증
npm install react-hook-form zod @hookform/resolvers
```

## 작업 순서 2 : ui 및 ag-grid

```bash
# 1. AG Grid 설치
npm install ag-grid-react ag-grid-community

# 2. Tailwind CSS v4 설치 및 설정 (Vite 전용)
npm install -D tailwindcss @tailwindcss/vite

# 3. shadcn/ui 초기화
npx shadcn@latest init
```

## UI shadcn 설치

### 1. Tailwind CSS v4 및 플러그인 설치
```bash
npm install tailwindcss @tailwindcss/vite tailwindcss-animate

```
### 2. Vite 설정 수정 (vite.config.ts)
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173
  }
})
```
### 3. TypeScript 설정 수정 (tsconfig.json 및 tsconfig.app.json)
```json
{
  "compilerOptions": {
    // ... 기존 설정
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4. src/index.css 설정

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";

@custom-variant dark (&:where(.dark, .dark *));
```

### 5. shadcn 초기화

```bash
npx shadcn@latest init
npm install tailwindcss-animate
```