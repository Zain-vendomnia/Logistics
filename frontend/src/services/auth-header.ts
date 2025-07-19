// auth-header.ts
export default function authHeader(): { Authorization: string } {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  return {
    Authorization: user?.accessToken ? `Bearer ${user.accessToken}` : ''
  };
}
