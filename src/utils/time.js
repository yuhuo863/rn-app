import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const formatActionTime = (time) => {
  const now = dayjs()
  const target = dayjs(time)
  const diffDays = now.diff(time, 'day')

  if (diffDays >= 7) {
    return '7 天前'
  }
  if (diffDays >= 14) {
    return target.format('YYYY-MM-DD')
  }
  // 插件会自动根据当前时间和目标时间的差异来选择合适的时间单位进行格式化
  return target.fromNow()
}
