import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiService from '@/utils/request'
import { QUERY_KEYS } from '@/utils/queryKeys'

// --- 获取列表 (读) ---
export const usePasswordsQuery = (params) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.passwords, params], // 参数变化自动刷新
    queryFn: async () => {
      return await apiService.get('/password', { params })
    },
    staleTime: 1000 * 60, // 1分钟内数据被认为是新鲜的，不重复请求
  })
}

// --- 删除密码 (写 - 自动同步) ---
export const useDeletePasswordMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => apiService.delete(`/password/${id}`),

    // 成功后的副作用：核心逻辑！
    onSuccess: () => {
      // 1. 告诉 React Query：密码列表过期了，回收站也过期了
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.passwords })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash })
      // 2. 刷新分类计数
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
    },
  })
}
