# Инструкция по переустановке зависимостей

## Проблема
Ошибка: `Cannot find module './transformation/file/file.js'` в `@babel/core`

## Решение

Выполните следующие команды **по порядку** в PowerShell в папке `frontend`:

### Шаг 1: Остановите dev сервер
Нажмите `Ctrl+C` в терминале, где запущен `npm run dev`

### Шаг 2: Удалите старые зависимости
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

### Шаг 3: Очистите кэш npm
```powershell
npm cache clean --force
```

### Шаг 4: Переустановите зависимости
```powershell
npm install
```

### Шаг 5: Если проблема сохраняется, попробуйте установить Babel явно
```powershell
npm install --save-dev @babel/core@latest @babel/preset-react@latest
```

### Шаг 6: Запустите dev сервер
```powershell
npm run dev
```

## Альтернативное решение: Использование yarn

Если npm продолжает вызывать проблемы:

```powershell
# Установите yarn (если еще не установлен)
npm install -g yarn

# В папке frontend
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue

# Установите зависимости
yarn install

# Запустите dev сервер
yarn dev
```

## Если ничего не помогает

1. Проверьте версию Node.js (должна быть 18+):
   ```powershell
   node --version
   ```

2. Если версия старая, обновите Node.js с https://nodejs.org/

3. Попробуйте использовать другой менеджер пакетов (pnpm):
   ```powershell
   npm install -g pnpm
   cd frontend
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   pnpm install
   pnpm dev
   ```

