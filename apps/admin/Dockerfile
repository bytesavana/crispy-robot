FROM node:22-slim AS build
RUN corepack enable && corepack prepare pnpm@11.13.0 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps apps
RUN pnpm install --frozen-lockfile

ARG VITE_API_URL
ARG VITE_OPS_KEY
ARG VITE_SERVICE_CATALOG_URL
ARG VITE_SERVICE_REQUEST_ORCHESTRATOR_URL
ARG VITE_CONSUMERS_URL
ENV VITE_API_URL=$VITE_API_URL \
    VITE_OPS_KEY=$VITE_OPS_KEY \
    VITE_SERVICE_CATALOG_URL=$VITE_SERVICE_CATALOG_URL \
    VITE_SERVICE_REQUEST_ORCHESTRATOR_URL=$VITE_SERVICE_REQUEST_ORCHESTRATOR_URL \
    VITE_CONSUMERS_URL=$VITE_CONSUMERS_URL
RUN pnpm --filter admin build

FROM nginx:alpine AS runtime
COPY --from=build /repo/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
