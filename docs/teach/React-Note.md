# React Note

## 개요

- 여러가지 front end 개발과 관련된 소소한 기술 노트

## 표현

```ts
export default function TodoAddModal({ onClose }: Props) {
export const TodoAddModal: React.FC<Props> = ({ onClose }) => { 
```
같은 표현인가?
아니요, 두 코드는 동일하지 않습니다.

첫 번째 코드 `export default function TodoAddModal({ onClose }: Props) {`는 함수 컴포넌트를 기본적으로 내보내는 방식입니다. 이 경우, 컴포넌트를 가져올 때 이름을 마음대로 지정할 수 있습니다.

두 번째 코드 `export const TodoAddModal: React.FC<Props> = ({ onClose }) => {`는 명명된 내보내기를 사용합니다. 이렇게 하면 컴포넌트를 가져올 때 반드시 `TodoAddModal`이라는 이름으로 가져와야 합니다.

따라서, 두 방식은 동일한 기능을 수행하지만, 모듈에서 컴포넌트를 가져오는 방식에 차이가 있습니다.
