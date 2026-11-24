import { supabase } from '@/lib/supabaseClient'
import {
  fetchCurrentUser,
  passwordRecoveryStarted,
  selectAuth,
  sessionEnded,
  sessionStarted,
} from './authSlice'

/** Keeps Redux in step with the Supabase session, including other browser tabs. */
export function startAuthListener(store) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      store.dispatch(passwordRecoveryStarted())
    }

    if (!session) {
      store.dispatch(sessionEnded())
      return
    }

    // Also runs on token refresh and tab focus, when the user is already known.
    const userId = session.user.id
    if (selectAuth(store.getState()).sessionUserId === userId) return

    store.dispatch(sessionStarted(userId))
    // Supabase holds a lock during this callback, and the request needs that lock.
    setTimeout(() => store.dispatch(fetchCurrentUser(userId)), 0)
  })
}
