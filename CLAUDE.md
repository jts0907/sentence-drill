# sentence-drill

영어, 일본어 문장 암기용 개인 앱. 사용자는 "보스"로 부르고 존댓말을 쓴다.

## 학습자
- 영어: 듣기 초급 (영화, 드라마의 느린 대화를 겨우 듣는 정도)
- 일본어: 히라가나를 읽는 정도, 일상 단어와 간단한 문장 일부. 가타카나는 아직 익숙하지 않을 수 있음
- 기기: iPhone (기본 브라우저를 Safari로 바꿨고, 사이트 마이크는 "허용"으로 설정), 노트북
- 예산: 완전 무료가 원칙. 유료 API는 사용자 동의 없이 도입하지 않는다

## 구성
- `index.html`: 앱 전체 (단일 파일, 외부 라이브러리 없음). GitHub Pages로 `main` 브랜치 루트에서 배포
  - 주소: https://jts0907.github.io/sentence-drill/
- `apps-script/Code.gs`: 구글시트 백엔드. 시트 이름 `Sentences`, 토큰은 Script Properties `TOKEN`
  - 수정 후에는 [배포 관리] > 새 버전으로 재배포해야 URL이 유지된다
- 음성 출력: Web Speech API `speechSynthesis` / 음성 인식: `webkitSpeechRecognition` (Safari 전용)
- 저장: localStorage 캐시 + 변경 큐(upsert, del)를 Apps Script로 POST (text/plain, preflight 없음)
- 복습: SM-2 단순화 (`schedule()`)

## iOS에서 확인된 동작 (재발 주의)
- 홈 화면 독립 실행 모드에서는 음성 인식이 응답 없이 멈춘다. 그래서 standalone이면 인식을 막는다
- "웹 앱으로 열기"를 끄고 홈 화면에 추가하면 기본 브라우저로 열린다
- 사용자 터치 직후가 아니면 speechSynthesis가 막힌다. 무음 발화로 잠금 해제 + 시간 제한으로 진행 보장
- 마이크 허용 알림은 Safari 사이트 설정에서 "허용"으로 해결됨

## 문장 데이터 형식 (붙여넣기)
- 영어: `문장 | 한국어 뜻 | 메모`
- 일본어: `문장 | 히라가나 읽기 | 한국어 뜻 | 핵심 문법 한 줄`
- 같은 언어, 같은 문장은 가져올 때 건너뛴다
- 새 문장은 언어별 하루 5~10개 권장
- 지금까지 제공한 묶음은 `sets/`에 기록한다. 새 묶음을 만들 때 겹치지 않게 먼저 확인한다

## 작업 규칙
- 변경 후 Playwright(Chromium 헤드리스)로 동작 확인 뒤 `main`에 푸시
- iOS 실기기에서만 확인 가능한 부분은 확인하지 못했다고 명시한다
