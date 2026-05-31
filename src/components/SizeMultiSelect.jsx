import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './SizeMultiSelect.css'

function parseSizeValue(value) {
  if (!value) return []
  const raw = Array.isArray(value) ? value : String(value).split(/[,;]+/)
  const seen = new Set()
  const unique = []
  for (const s of raw) {
    const t = String(s).trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    unique.push(t)
  }
  return unique
}

function joinSizeValue(sizes) {
  const seen = new Set()
  const unique = []
  for (const s of sizes) {
    const t = String(s).trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    unique.push(t)
  }
  return unique.join(',')
}

export default function SizeMultiSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Выберите размеры…',
  disabled = false,
  required = false,
  id: idProp,
  className = '',
}) {
  const autoId = useId()
  const inputId = idProp || autoId
  const rootRef = useRef(null)
  const controlRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState(null)

  const selected = useMemo(() => parseSizeValue(value), [value])

  const sortedOptions = useMemo(() => {
    const optionSet = new Set(options.map((s) => String(s).trim()).filter(Boolean))
    selected.forEach((s) => optionSet.add(s))
    const all = [...optionSet]
    const selectedSet = new Set(selected)
    const selectedFirst = selected.filter((s) => selectedSet.has(s))
    const rest = all
      .filter((s) => !selectedSet.has(s))
      .sort((a, b) => String(a).localeCompare(String(b), 'ru', { numeric: true }))
    return [...selectedFirst, ...rest]
  }, [options, selected])

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sortedOptions
    return sortedOptions.filter((size) => String(size).toLowerCase().includes(q))
  }, [sortedOptions, query])

  const updateDropdownPosition = useCallback(() => {
    const el = controlRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 4
    const maxHeight = 280
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow
    const available = openUp ? spaceAbove : spaceBelow
    const listMaxHeight = Math.min(maxHeight, Math.max(120, available - 48))

    setDropdownStyle({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight: listMaxHeight + 48,
      transform: openUp ? 'translateY(-100%)' : undefined,
    })
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => {
      const inRoot = rootRef.current?.contains(e.target)
      const inDropdown = dropdownRef.current?.contains(e.target)
      if (!inRoot && !inDropdown) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (!open) {
      setDropdownStyle(null)
      return undefined
    }
    updateDropdownPosition()
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [open, updateDropdownPosition])

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [open])

  const emitChange = (next) => {
    onChange?.(joinSizeValue(next))
  }

  const toggleSize = (size) => {
    const next = selected.includes(size)
      ? selected.filter((s) => s !== size)
      : [...selected, size]
    emitChange(next)
  }

  const removeSize = (size, e) => {
    e?.stopPropagation()
    emitChange(selected.filter((s) => s !== size))
  }

  const clearAll = (e) => {
    e?.stopPropagation()
    emitChange([])
    setOpen(false)
    setQuery('')
  }

  const openDropdown = () => {
    if (disabled) return
    updateDropdownPosition()
    setOpen(true)
  }

  const dropdownNode = open && dropdownStyle ? (
    <div
      ref={dropdownRef}
      className="size-multi-select__dropdown size-multi-select__dropdown--portal"
      style={{
        top: dropdownStyle.top,
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        maxHeight: dropdownStyle.maxHeight,
        transform: dropdownStyle.transform,
      }}
    >
      <input
        ref={searchRef}
        type="search"
        className="size-multi-select__search"
        placeholder="Поиск размера…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            setQuery('')
          }
        }}
      />
      <ul
        className="size-multi-select__list"
        role="listbox"
        aria-multiselectable="true"
        style={{ maxHeight: Math.max(120, (dropdownStyle.maxHeight || 280) - 48) }}
      >
        {filteredOptions.length === 0 ? (
          <li className="size-multi-select__empty">Размеры не найдены</li>
        ) : (
          filteredOptions.map((size) => {
            const checked = selected.includes(size)
            return (
              <li key={size}>
                <label className={`size-multi-select__option${checked ? ' size-multi-select__option--selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSize(size)}
                  />
                  <span>{size}</span>
                </label>
              </li>
            )
          })
        )}
      </ul>
    </div>
  ) : null

  return (
    <div
      ref={rootRef}
      className={`size-multi-select${open ? ' size-multi-select--open' : ''}${disabled ? ' size-multi-select--disabled' : ''} ${className}`.trim()}
    >
      <div
        ref={controlRef}
        id={inputId}
        className="size-multi-select__control"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => {
              if (!v) updateDropdownPosition()
              return !v
            })
          }
          if (e.key === 'Escape') {
            setOpen(false)
            setQuery('')
          }
        }}
      >
        <div className="size-multi-select__values">
          {selected.length === 0 ? (
            <span className="size-multi-select__placeholder">{placeholder}</span>
          ) : (
            selected.map((size) => (
              <span key={size} className="size-multi-select__tag">
                {size}
                {!disabled && (
                  <button
                    type="button"
                    className="size-multi-select__tag-remove"
                    aria-label={`Убрать размер ${size}`}
                    onClick={(e) => removeSize(size, e)}
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        {selected.length > 0 && !disabled && (
          <button
            type="button"
            className="size-multi-select__clear"
            aria-label="Очистить выбранные размеры"
            onClick={clearAll}
          >
            ×
          </button>
        )}
        <span className="size-multi-select__arrow" aria-hidden="true" />
      </div>

      {required && selected.length === 0 && (
        <input
          tabIndex={-1}
          className="size-multi-select__validator"
          value=""
          required
          onChange={() => {}}
          aria-hidden="true"
        />
      )}

      {typeof document !== 'undefined' && dropdownNode
        ? createPortal(dropdownNode, document.body)
        : null}
    </div>
  )
}

export { parseSizeValue, joinSizeValue }
