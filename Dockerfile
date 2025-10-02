FROM node:18

# рабочая папка
WORKDIR /app

# копируем package.json и package-lock.json
COPY package*.json ./

# ставим зависимости (соберутся под Linux)
RUN npm install

# копируем исходники
COPY . .

# создаём папку для БД
RUN mkdir -p /app/data

CMD ["node", "src/index.js"]
