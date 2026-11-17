import { auth, provider } from '../../config/firebase-config';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate, Navigate } from 'react-router-dom';
import { useGetUserInfo } from '../../hooks/useGetUserInfo';

import './styles.css';

export const Auth = () => {
    const navigate = useNavigate();
    const { isAuth } = useGetUserInfo();

    const signInWithGoogle = async () => {
        try {
            const results = await signInWithPopup( auth, provider )
            // Only non-secret DISPLAY info goes in localStorage.
            // The UID is no longer stored here — the app now always reads it
            // from Firebase Auth (auth.currentUser), which can't be faked.
            const authInfo = {
                name: results.user.displayName,
                profilePhoto: results.user.photoURL,
                isAuth: true,
            };
            localStorage.setItem("auth", JSON.stringify(authInfo));
            navigate("/expense-tracker")
        } catch (err) {
            // e.g. the user closed the Google popup
            console.error(err);
        }
    };

    if ( isAuth ) {
        return <Navigate to ="/expense-tracker" />;
    }

    return (
    <div className="auth">
        <p>Sign in with Google to Continue</p>
        <button className="login-with-google-button" onClick={signInWithGoogle}>
            Sign in with Google
        </button>
    </div>
    );
};
