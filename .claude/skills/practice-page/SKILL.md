---
name: practice-page
description: 자체적으로 만든 component 또는 외부 라이브러리에서 가져온 component의 사용법을 확인 및 연습할 수 있는 페이지를 작성한다.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob
argument-hint: "component 사용법을 확인 및 연습할 수 있는 페이지를 만들어 줘."
---


# 작성 방법

## 개요

- 자체적으로 만든 component 또는 외부 라이브러리에서 가져온 component의 사용법을 확인 및 연습할 수 있는 페이지를 작성한다.
- toolbar의 '실습' 메뉴의 하위에 메뉴명 '<Component명> 연습'으로 추가한다. 예시) 'DatePicker 연습'

## Page작성 방법

- frontend/src/practice 폴더에 작성한다.
- 파일명은 Practice<Component명>.tsx 형태로 작성한다. 예시) PracticeDatePicker.tsx
- 페이지의 main div는  `<main className="container mx-auto px-4 py-6">`  을 사용한다.
- docs/<component명>-사용법.md markdown문서를 작성한다.


