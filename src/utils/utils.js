// 创建随机数
export function createRandomNum(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min)
}