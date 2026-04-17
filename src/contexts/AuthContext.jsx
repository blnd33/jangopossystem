import { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentUser, setCurrentUser, logout as logoutUser,
  getUsers, saveUsers, logAccess, addNotification
} from '../data/store';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always clear session on app start — force login every time
    logoutUser();
    setLoading(false);
  }, []);

  function login(username, password) {
    const users = getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
    );

    if (!user) return false;

    // Update last login time
    const updatedUsers = users.map(u =>
      u.id === user.id
        ? { ...u, lastLogin: new Date().toISOString() }
        : u
    );
    saveUsers(updatedUsers);

    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    setCurrentUser(updatedUser);
    setCurrentUserState(updatedUser);

    // Log access
    logAccess(updatedUser, 'login');

    // Notify super admin if not super admin logging in
    if (user.role !== 'superadmin') {
      addNotification(
        `${user.name} (${user.username}) logged into the system`,
        'login'
      );
    }

    return true;
  }

  function logout() {
    if (currentUser) {
      logAccess(currentUser, 'logout');
      if (currentUser.role !== 'superadmin') {
        addNotification(
          `${currentUser.name} (${currentUser.username}) logged out of the system`,
          'logout'
        );
      }
    }
    logoutUser();
    setCurrentUserState(null);
  }

  function hasPermission(page) {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    return currentUser.permissions?.[page] === true;
  }

  function isSuperAdmin() {
    return currentUser?.role === 'superadmin';
  }

  function isAdmin() {
    return currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  }

  function refreshUser() {
    const users = getUsers();
    const updated = users.find(u => u.id === currentUser?.id);
    if (updated) {
      setCurrentUser(updated);
      setCurrentUserState(updated);
    }
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      hasPermission,
      isSuperAdmin,
      isAdmin,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}