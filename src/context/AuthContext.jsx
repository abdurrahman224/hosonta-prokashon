import { useState } from 'react'
import usersSeed from '../data/users'
import { hasPermission, PERMISSIONS } from '../utils/roles'
import { recordEmployeeWebsiteVisit } from '../utils/employeeStorage'
import AuthContext from './AuthContextValue'

const USERS_KEY = 'hosonta_auth_users'
const SESSION_KEY = 'hosonta_auth_session'

function getStoredUsers() {
  try {
    const storedUsers = localStorage.getItem(USERS_KEY)
    if (!storedUsers) return usersSeed
    const stored = JSON.parse(storedUsers)
    const existingIds = new Set(stored.map((user) => user.id))
    return [...stored, ...usersSeed.filter((user) => !existingIds.has(user.id))]
  } catch {
    return usersSeed
  }
}

function getStoredSession() {
  try {
    const session = localStorage.getItem(SESSION_KEY)
    return session ? JSON.parse(session) : null
  } catch {
    return null
  }
}

function createSessionUser(user) {
  const sessionUser = { ...user }
  delete sessionUser.password
  return sessionUser
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(getStoredUsers)
  const [currentUser, setCurrentUser] = useState(getStoredSession)

  const login = (email, password) => {
    const user = users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    )

    if (!user || user.password !== password) {
      return { success: false, message: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' }
    }
    if (user.status === 'pending') {
      return {
        success: false,
        message: 'আপনার অ্যাকাউন্ট অনুমোদনের অপেক্ষায় আছে।',
      }
    }
    if (user.status === 'suspended') {
      return {
        success: false,
        message: 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে।',
      }
    }

    const sessionUser = createSessionUser(user)
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    setCurrentUser(sessionUser)
    if (sessionUser.role === 'employee') {
      recordEmployeeWebsiteVisit(sessionUser.id, 'Website Login')
    }
    return { success: true, user: sessionUser }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
  }

  const register = ({ name, email, password, wantsToBeAuthor = false }) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।' }
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: wantsToBeAuthor ? 'author' : 'user',
      status: wantsToBeAuthor ? 'pending' : 'active',
      avatar: `https://i.pravatar.cc/100?u=${encodeURIComponent(normalizedEmail)}`,
    }

    const nextUsers = [...users, newUser]
    setUsers(nextUsers)
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    if (wantsToBeAuthor) {
      const applicationKey = 'hosonta_author_applications'
      const existingApplications = JSON.parse(localStorage.getItem(applicationKey) || '[]')
      localStorage.setItem(
        applicationKey,
        JSON.stringify([
          ...existingApplications,
          {
            id: `author-application-${Date.now()}`,
            userId: newUser.id,
            name: newUser.name,
            identity: 'রেজিস্ট্রেশনের সময় লেখক হওয়ার আবেদন',
            sample: '',
            motivation: '',
            status: 'pending',
            feedback: '',
            submittedAt: new Date().toISOString(),
          },
        ]),
      )
    }
    return { success: true, user: createSessionUser(newUser) }
  }

  const updateUserRole = (userId, role) => {
    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.MANAGE_ROLES)) {
      return { success: false, message: 'Permission denied.' }
    }
    const nextUsers = users.map((user) => user.id === userId ? { ...user, role, status: user.status || 'active' } : user)
    setUsers(nextUsers)
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    return { success: true }
  }

  const updateUserStatus = (userId, status) => {
    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, message: 'Permission denied.' }
    }
    const nextUsers = users.map((user) => (user.id === userId ? { ...user, status } : user))
    setUsers(nextUsers)
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    return { success: true }
  }

  const createEmployeeUser = ({ name, email, password, phone = '' }) => {
    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, message: 'Permission denied.' }
    }
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!name?.trim() || !normalizedEmail || !password) {
      return { success: false, message: 'Name, email, and password are required.' }
    }
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'An account with this email already exists.' }
    }
    const newEmployee = {
      id: `user-employee-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      role: 'employee',
      status: 'active',
      avatar: `https://i.pravatar.cc/100?u=${encodeURIComponent(normalizedEmail)}`,
    }
    const nextUsers = [...users, newEmployee]
    setUsers(nextUsers)
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    return { success: true, user: createSessionUser(newEmployee) }
  }

  const approveAuthorApplication = (userId, role = 'author') => {
    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.AUTHOR_APPLICATIONS_REVIEW)) {
      return { success: false, message: 'এই কাজের অনুমতি নেই।' }
    }
    const nextUsers = users.map((user) =>
      user.id === userId ? { ...user, role, status: 'active' } : user,
    )
    setUsers(nextUsers)
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    return { success: true }
  }

  const updateProfile = (updates) => {
    if (!currentUser) return { success: false, message: 'লগইন করা নেই।' }
    const nextUsers = users.map((user) =>
      user.id === currentUser.id ? { ...user, ...updates } : user,
    )
    const nextUser = nextUsers.find((user) => user.id === currentUser.id)
    const sessionUser = createSessionUser(nextUser)
    setUsers(nextUsers)
    setCurrentUser(sessionUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    return { success: true, user: sessionUser }
  }

  const changePassword = (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, message: 'লগইন করা নেই।' }
    const user = users.find((item) => item.id === currentUser.id)
    if (!user || user.password !== currentPassword) {
      return { success: false, message: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' }
    }
    const nextUsers = users.map((item) =>
      item.id === currentUser.id ? { ...item, password: newPassword } : item,
    )
    setUsers(nextUsers)
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    return { success: true }
  }

  const authValue = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    users,
    updateUserRole,
    updateUserStatus,
    createEmployeeUser,
    approveAuthorApplication,
    hasRole: (...roles) => Boolean(currentUser && roles.includes(currentUser.role)),
    can: (permission) =>
      Boolean(currentUser && hasPermission(currentUser.role, permission)),
  }

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
}
