import { createContext, useReducer, useContext, useState, useEffect } from 'react'
import apiService from '@/utils/request'

const CategoryContext = createContext()

// 定义动作类型
const ACTION_TYPES = {
  SET_CATEGORIES: 'SET_CATEGORIES',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  ADD_CATEGORY: 'ADD_CATEGORY',
}

// Reducer 处理逻辑
function categoryReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_CATEGORIES:
      return { ...state, categories: action.payload }
    case ACTION_TYPES.ADD_CATEGORY:
      return { ...state, categories: [action.payload, ...state.categories] }
    case ACTION_TYPES.UPDATE_CATEGORY:
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id ? action.payload : cat,
        ),
      }
    case ACTION_TYPES.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter((cat) => cat.id !== action.payload),
      }
    default:
      return state
  }
}

export const CategoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(categoryReducer, { categories: [] })
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchCategories = async () => {
    try {
      const response = await apiService.get('/category')
      const data = response.categories || []
      dispatch({ type: 'SET_CATEGORIES', payload: data })
      setIsInitialized(true)
    } catch (error) {
      console.error('初始化分类失败:', error)
    }
  }
  useEffect(() => {
    fetchCategories()
  }, [])
  return (
    <CategoryContext.Provider
      value={{ state, dispatch, ACTION_TYPES, isInitialized, refreshCategories: fetchCategories }}
    >
      {children}
    </CategoryContext.Provider>
  )
}

export const useCategoryContext = () => useContext(CategoryContext)
