import { atom } from "recoil"

const getAvatarUrl = (user) => {
  if (!user || !user.email) return "";
  const encodedName = encodeURIComponent(user.name || "User");
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff`;

  // If it's a Gmail address, specifically ask for the Google avatar
  if (user.email.toLowerCase().includes('@gmail.com')) {
    return `https://unavatar.io/google/${user.email}?fallback=${encodeURIComponent(fallbackUrl)}`;
  }

  // Default to generic for others
  return `https://unavatar.io/${user.email}?fallback=${encodeURIComponent(fallbackUrl)}`;
};

const processUser = (user) => {
  if (user) {
    // Always attempt to set a better avatar if one isn't explicitly set, is the default, or is a relative path
    if (!user.avatar || user.avatar.includes('gravatar.com') || user.avatar === '/User.jpeg' || user.avatar.startsWith('/')) {
      return { ...user, avatar: getAvatarUrl(user) };
    }
  }
  return user;
};

export const setUserData = (data) => {
  const existing = JSON.parse(localStorage.getItem('user') || '{}');
  const token = data.token || existing.token;

  // Preserve local name if backend returns default "Demo User" (Offline/Fallback mode)
  if (data.name === "Demo User" && existing.name && existing.name !== "Demo User") {
    data.name = existing.name;
  }

  const processedData = processUser(data);
  const finalData = { ...processedData, token };

  // Update primary user
  localStorage.setItem("user", JSON.stringify(finalData));

  // Update account list
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const existingIndex = accounts.findIndex(a => a.email === finalData.email);
  if (existingIndex > -1) {
    accounts[existingIndex] = finalData;
  } else {
    accounts.push(finalData);
  }
  localStorage.setItem('accounts', JSON.stringify(accounts));
  return finalData;
}
export const getUserData = () => {
  const data = JSON.parse(localStorage.getItem('user'))
  return processUser(data);
}
export const getAccounts = () => {
  const data = JSON.parse(localStorage.getItem('accounts') || '[]');
  return data.map(processUser);
}
export const removeAccount = (email) => {
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const filtered = accounts.filter(a => a.email !== email);
  localStorage.setItem('accounts', JSON.stringify(filtered));

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (currentUser.email === email) {
    localStorage.removeItem('user');
    if (filtered.length > 0) {
      localStorage.setItem('user', JSON.stringify(filtered[0]));
    }
  }
}
export const clearUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accounts');
}
export const updateUser = (updates) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const updatedUser = { ...user, ...updates };
  localStorage.setItem('user', JSON.stringify(updatedUser));

  // Also update in accounts list
  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const index = accounts.findIndex(a => a.email === user.email);
  if (index > -1) {
    accounts[index] = { ...accounts[index], ...updates };
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }
  return updatedUser;
}
const getUser = () => {
  try {
    const item = localStorage.getItem('user');
    if (!item || item === "undefined" || item === "null") return null;
    const user = JSON.parse(item);
    if (user) {
      return processUser(user)
    }
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
    localStorage.removeItem('user'); // Clear corrupted data
  }
  return null
}
export const toggleState = atom({
  key: "toggle",
  default: { subscripPgTgl: false, notify: false, sidebarOpen: false, platformSubTgl: false }
})

export const userData = atom({
  key: 'userData',
  default: { user: getUser() }
})

export const sessionsData = atom({
  key: 'sessionsData',
  default: []
})