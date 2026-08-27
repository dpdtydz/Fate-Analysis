# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-slim AS builder
WORKDIR /app

# 의존성 레이어 캐시: 매니페스트만 먼저 복사
COPY package.json package-lock.json ./
RUN npm ci

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
