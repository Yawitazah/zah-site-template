# Explicit build, not Railpack. Same reasoning as every other ZAH client site:
# Railpack's Node path installs apt packages and has failed on Railway's
# builders, and node:20-alpine skips that entirely.
FROM node:20-alpine

# git: the ZAH products install straight from GitHub (github:Yawitazah/...).
RUN apk add --no-cache git

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
