FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "docker-entrypoint.sh"]
