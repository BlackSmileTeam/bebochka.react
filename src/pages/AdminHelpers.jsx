import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import AdminLookupPanel from '../components/admin/AdminLookupPanel'
import { api } from '../services/api'
import './AdminHelpers.css'

const TABS = [
  { id: 'brands', label: 'Бренды' },
  { id: 'conditions', label: 'Состояния' },
  { id: 'colors', label: 'Цвета' },
]

export default function AdminHelpers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'brands'

  const panelProps = useMemo(() => {
    if (tab === 'colors') {
      return {
        idPrefix: 'color',
        addPlaceholder: 'Новый цвет',
        emptyMessage: 'Цвета не найдены',
        loadErrorMessage: 'Не удалось загрузить цвета',
        loadItems: (s) => api.getProductColors(s),
        createItem: (name) => api.createProductColor(name),
        updateItem: (id, name) => api.updateProductColor(id, name),
        deleteItem: (id) => api.deleteProductColor(id),
      }
    }
    if (tab === 'conditions') {
      return {
        idPrefix: 'condition',
        addPlaceholder: 'Новое состояние',
        emptyMessage: 'Состояния не найдены',
        loadErrorMessage: 'Не удалось загрузить состояния',
        loadItems: (s) => api.getProductConditions(s),
        createItem: (name) => api.createProductCondition(name),
        updateItem: (id, name) => api.updateProductCondition(id, name),
        deleteItem: (id) => api.deleteProductCondition(id),
      }
    }
    return {
      idPrefix: 'brand',
      addPlaceholder: 'Новый бренд',
      emptyMessage: 'Бренды не найдены',
      loadErrorMessage: 'Не удалось загрузить бренды',
      loadItems: (s) => api.getBrands(s),
      createItem: (name) => api.createBrand({ name }),
      updateItem: (id, name) => api.updateBrand(id, { name }),
      deleteItem: (id) => api.deleteBrand(id),
    }
  }, [tab])

  return (
    <PageShell title="Помощники">
      <p className="admin-helpers-lead">
        Здесь хранятся значения для выпадающих списков при добавлении товара.
      </p>
      <div className="admin-helpers-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`admin-helpers-tab${tab === t.id ? ' admin-helpers-tab--active' : ''}`}
            onClick={() => setSearchParams({ tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="admin-helpers-panel" role="tabpanel">
        <AdminLookupPanel key={tab} {...panelProps} />
      </div>
    </PageShell>
  )
}
