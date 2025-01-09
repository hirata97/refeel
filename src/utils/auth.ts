export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('user') // ユーザー情報があれば認証済みとみなす
}
