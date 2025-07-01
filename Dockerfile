FROM node:20
    
    # Verzeichnisse anlegen
    WORKDIR /app
    
    # Backend-Code kopieren
    COPY package*.json ./
    COPY auth/ ./auth/
    COPY middlewares/ ./middlewares/
    COPY models/ ./models/
    COPY routes/ ./routes/
    COPY server.js ./

    
    # dist-Ordner aus dem Builder nehmen
    COPY frontend/dist/ ./frontend/dist/
    
    # Backend-Dependencies
    RUN npm ci --omit=dev
    
    EXPOSE 80
    ENV NODE_ENV=production
    
    CMD ["node", "server.js"]