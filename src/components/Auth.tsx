import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogOut, Loader2 } from 'lucide-react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, silently ignore or handle
        console.log('Sign-in popup closed by user.');
      } else {
        console.error('Sign-in error', error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      sessionStorage.removeItem('fria_pin_verified');
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out error', error);
    }
  };

  return { user, loading, isSigningIn, signIn, signOut };
}

export function AuthButton() {
  const { user, isSigningIn, signIn, signOut } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-slate-500 cursor-pointer hover:text-red-600 flex items-center gap-1" onClick={signOut}>
             چوونەدەرەوە
             <LogOut className="w-4 h-4" />
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User" />
          ) : (
             <span className="text-slate-500">{user.email?.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      disabled={isSigningIn}
      className="px-4 py-1.5 bg-red-600 shadow-sm shadow-red-200 rounded-md text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center gap-2"
    >
      {isSigningIn ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          چاوەڕوان بە...
        </>
      ) : (
        'چوونەژوورەوە'
      )}
    </button>
  );
}
