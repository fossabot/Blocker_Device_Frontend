# IoT Device Frontend

## 소개
이 프로젝트는 블록체인 기반 IoT 디바이스 소프트웨어 업데이트 시스템의 프론트엔드입니다. React와 TypeScript를 사용하여 개발되었으며, Vite를 빌드 도구로 사용합니다.

## 주요 기능
- 실시간 디바이스 상태 모니터링
- 블록체인 연결 상태 확인
- 소프트웨어 업데이트 목록 조회
- 업데이트 구매 및 설치 관리
- 업데이트 이력 조회

## 시작하기

### 개발 환경 설정
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 프로젝트 구조
```
src/
├── components/     # UI 컴포넌트
├── pages/         # 페이지 컴포넌트
├── services/      # API 통신 로직
├── hooks/         # 커스텀 훅
├── types/         # TypeScript 타입 정의
├── utils/         # 유틸리티 함수
└── assets/        # 정적 리소스
```

## API 연동
- 디바이스 정보 조회
- 업데이트 목록 조회
- 업데이트 설치
- 업데이트 이력 조회
