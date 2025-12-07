# Исправление ошибки Babel в dev режиме

## Проблема
- `npm run build` работает успешно ✅
- `npm run dev` выдает ошибку с Babel ❌

Это указывает на проблему с кэшем Vite или установкой Babel для dev режима.

## Решение

### Шаг 1: Очистите кэш Vite и node_modules

```powershell
cd frontend

# Остановите dev сервер (Ctrl+C если запущен)

# Удалите кэш Vite
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue

# Удалите node_modules
Remove-Item -Recurse -Force node_modules

# Очистите кэш npm
npm cache clean --force

# Переустановите зависимости
npm install
```

### Шаг 2: Если не помогло - переустановите @babel/core явно

```powershell
cd frontend

# Удалите @babel/core
npm uninstall @babel/core

# Переустановите
npm install --save-dev @babel/core@^7.28.5

# Или установите последнюю версию
npm install --save-dev @babel/core@latest
```

### Шаг 3: Очистите кэш Vite и перезапустите

```powershell
# Удалите кэш Vite
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue

# Запустите dev сервер
npm run dev
```

### Шаг 4: Альтернативное решение - обновите @vitejs/plugin-react

```powershell
cd frontend

# Обновите плагин React
npm install --save-dev @vitejs/plugin-react@latest

# Очистите кэш
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue

# Перезапустите
npm run dev
```

### Шаг 5: Если ничего не помогает - используйте SWC вместо Babel

Обновите `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // Используйте SWC вместо Babel

export default defineConfig({
  plugins: [react()],
  // ... остальная конфигурация
})
```

Затем установите:
```powershell
npm install --save-dev @vitejs/plugin-react-swc
```

## Почему build работает, а dev нет?

- **Build режим** использует другой механизм трансформации (esbuild)
- **Dev режим** использует Babel для hot reload и быстрой трансформации
- Проблема может быть в поврежденном кэше Vite или неполной установке Babel

## Быстрое решение (попробуйте первым)

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
npm run dev
```

