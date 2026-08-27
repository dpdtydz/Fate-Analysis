# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-slim AS builder
WORKDIR /app

# 의존성 레이어 캐시: 매니페스트만 먼저 복사
COPY package.json package-lock.json ./
RUN npm ci

# VITE_* 값은 vite가 빌드 타임에 클라이언트 번들에 인라인한다.
# 런타임 환경변수로 넘겨봐야 이미 정적으로 구운 dist/assets에는 반영되지 않으므로
# 반드시 build 이전에 ARG로 받아 ENV로 노출해야 한다. 둘 다 코드에 fallback이 있어
# 값을 안 넘기면 기본값으로 빌드된다 (비밀값 아님 — 공개 광고 슬롯 ID).
ARG VITE_ADSENSE_CLIENT_ID
ARG VITE_ADSENSE_SLOT_ID
ENV VITE_ADSENSE_CLIENT_ID=$VITE_ADSENSE_CLIENT_ID
ENV VITE_ADSENSE_SLOT_ID=$VITE_ADSENSE_SLOT_ID

# 소스 복사 후 클라이언트(vite) + 서버(esbuild) 빌드 → dist/
COPY . .
RUN npm run build

# devDependencies 제거해 런타임에 넘길 node_modules를 슬림화
RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run이 PORT를 주입한다. 로컬 docker run 기본값으로 8080을 둔다.
ENV PORT=8080

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# 루트 권한 회피 (node 이미지에 기본 제공되는 비특권 사용자)
USER node

EXPOSE 8080
CMD ["node", "dist/server.cjs"]
