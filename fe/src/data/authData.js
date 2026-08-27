export const authAccounts = [
  { username: 'test', password: '123', role: 'author', displayName: 'Author Test' },
  { username: 'admin', password: '123', role: 'admin', displayName: 'Admin Test' },
];

export function authenticate(username, password) {
  return authAccounts.find((account) => account.username === username && account.password === password) || null;
}
