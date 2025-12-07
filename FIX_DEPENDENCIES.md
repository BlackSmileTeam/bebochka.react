# Исправление ошибки "Cannot find module './transformation/file/file.js'"

Эта ошибка возникает из-за поврежденных или неполных зависимостей в `node_modules`.

## Решение

Выполните следующие команды в терминале в папке `frontend`:

### Вариант 1: Полная переустановка (рекомендуется)

```powershell
# Перейдите в папку frontend
cd frontend

# Очистите кэш npm
npm cache clean --force

# Удалите node_modules и package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Переустановите зависимости
npm install
```

### Вариант 2: Если Вариант 1 не помог

```powershell
# Перейдите в папку frontend
cd frontend

# Удалите все
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Очистите кэш
npm cache clean --force

# Переустановите с очисткой кэша
npm install --cache /tmp/empty-cache

# Или используйте yarn (если установлен)
# yarn install
```

### Вариант 3: Использование yarn (альтернатива)

Если npm продолжает вызывать проблемы, попробуйте yarn:

```powershell
# Установите yarn (если еще не установлен)
npm install -g yarn

# Перейдите в папку frontend
cd frontend

# Удалите node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue

# Установите зависимости через yarn
yarn install
```

## После переустановки

Запустите dev сервер:

```powershell
npm run dev
# или
yarn dev
```

## Если проблема сохраняется

1. Проверьте версию Node.js (должна быть 18+):
   ```powershell
   node --version
   ```

2. Обновите npm:
   ```powershell
   npm install -g npm@latest
   ```

3. Попробуйте удалить глобальный кэш npm:
   ```powershell
   npm cache clean --force
   Remove-Item -Recurse -Force $env:APPDATA\npm-cache
   ```

4. Переустановите зависимости еще раз

