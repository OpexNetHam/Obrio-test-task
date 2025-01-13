FROM node:alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json

COPY apps/api apps/api
COPY libs libs

RUN npm install && npm cache clean --force

RUN npm run build

FROM node:alpine AS production 

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --prod && npm cache clean --force

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/api/main"]

# RUN chown -R node:node /app

# USER node
