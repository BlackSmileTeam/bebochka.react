# Исправление проблемы с Babel локально

## Проблема
Ошибка `Cannot find module './transformation/file/file.js'` в `@babel/core` возникает только локально, на сервере все работает.

## Решение: Использовать точные версии из package-lock.json

### Шаг 1: Удалите node_modules и переустановите из package-lock.json

```powershell
cd frontend

# Удалите node_modules
Remove-Item -Recurse -Force node_modules

# Очистите кэш npm
npm cache clean --force

# Установите зависимости ТОЧНО как в package-lock.json
npm ci
```

**Важно:** Используйте `npm ci` вместо `npm install` - это установит точные версии из `package-lock.json`, как на сервере.

### Шаг 2: Если npm ci не работает

```powershell
# Удалите package-lock.json и пересоздайте
Remove-Item -Force package-lock.json
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install
```

### Шаг 3: Проверьте версию Node.js

Убедитесь, что используете ту же версию Node.js, что и на сервере:

```powershell
node --version
```

Если версии отличаются, обновите Node.js до версии, используемой на сервере.

### Шаг 4: Если проблема сохраняется

Попробуйте использовать yarn с lock файлом:

```powershell
# Установите yarn
npm install -g yarn

# В папке frontend
cd frontend
Remove-Item -Recurse -Force node_modules
yarn install
yarn dev
```

## Почему это работает на сервере?

На сервере зависимости устанавливаются через Docker или GitHub Actions, где используется чистая установка из `package-lock.json`. Локально могут быть конфликты из-за:
- Кэша npm
- Разных версий Node.js
- Поврежденных node_modules
- Глобальных пакетов, влияющих на установку

## Рекомендация

Всегда используйте `npm ci` для установки зависимостей в production-подобных окружениях - это гарантирует точное соответствие версиям из `package-lock.json`.

