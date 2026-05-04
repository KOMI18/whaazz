FROM node:22-alpine
WORKDIR /app

# 1. Copie des fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
# Vérifie si tu as bien un fichier prisma.config.ts dans Whaazz comme dans Deygo
COPY prisma ./prisma/

# 2. Installation des dépendances
RUN npm install

# 3. Génération du client Prisma (pour la base whaazz_db)
RUN npx prisma generate

# 4. Copie du reste du code source
COPY . .

# 5. Build de l'application TypeScript
RUN npm run build

# 6. Port interne au container
EXPOSE 3000

# 7. Lancement (Vérifie bien que ton point d'entrée est aussi dist/src/index.js)
CMD ["node", "dist/src/index.js"]