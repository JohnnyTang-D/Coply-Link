FROM node:20-alpine

# 安装构建工具（better-sqlite3需要）
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY src ./src

ENV PORT=3818
ENV ADMIN_PASSWORD=admin123

EXPOSE 3818

CMD ["node", "server.js"]