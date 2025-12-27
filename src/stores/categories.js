import { create } from 'zustand'
import apiService from '@/utils/request'

const useCategoryStore = create((set, get) => ({
  categories: [],
  isLoading: false,
  searchQuery: '',
  // --- Actions ---

  // 设置搜索词
  setSearchQuery: (query) => set({ searchQuery: query }),

  // 初始化分类数据
  fetchCategories: async () => {
    set({ isLoading: true })
    try {
      const data = await apiService.get('/category')
      set({ categories: data.categories || [] })
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // 彻底重置 Store (退出登录时调用)
  reset: () =>
    set({
      categories: [],
      isLoading: false,
      searchQuery: '',
    }),

  // 增删改的本地状态同步
  addCategory: (newCat) => set((state) => ({ categories: [newCat, ...state.categories] })),

  updateCategory: (updatedCat) =>
    set((state) => ({
      categories: state.categories.map((c) => (c.id === updatedCat.id ? updatedCat : c)),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  // 获取过滤后的分类列表
  getFilteredCategories: () => {
    const { categories, searchQuery } = get()
    if (!searchQuery.trim()) return categories
    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    )
  },
}))

export default useCategoryStore
