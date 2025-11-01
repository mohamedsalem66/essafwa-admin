FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NEXT_SKIP_ESLINT=true
ENV NEXT_SKIP_TYPE_CHECK=true

RUN npm run build

FROM node:18 AS runner

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]

