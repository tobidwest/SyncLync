# ----------------------------
# Stage 1: Build Angular app
# ----------------------------
    FROM node:20 AS angular-builder

    WORKDIR /app/frontend/computer
    
   
    COPY frontend/computer/package*.json ./
    RUN npm ci
    
   
    COPY frontend/computer ./
    
   
    RUN npm run build -- --configuration production
    
# ----------------------------
# Stage 2: API + static files
# ----------------------------
FROM node:20 AS api

WORKDIR /app


COPY package*.json ./
RUN npm ci --omit=dev


COPY auth/ ./auth/
COPY middlewares/ ./middlewares/
COPY models/ ./models/
COPY routes/ ./routes/
COPY server.js ./


COPY frontend/tv ./frontend/tv

COPY --from=angular-builder /app/frontend/computer/dist/sync-link/browser ./frontend/computer/dist

EXPOSE 80
ENV NODE_ENV=production
CMD ["node", "server.js"]
    