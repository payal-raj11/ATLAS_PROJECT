// Shown after a successful sign-out. There's no real backend/auth
// behind this demo, so "signing back in" is honestly just re-entering
// the same session — it doesn't pretend to validate credentials.
function SignedOut({ onSignBackIn }) {

  return (

    <div className="signedout-screen">

      <div className="signedout-card">

        <div className="signedout-logo">AT</div>

        <h1>You've been signed out</h1>

        <p>
          Your ATLAS session has ended. Sign back in to continue managing
          land acquisition projects.
        </p>

        <button type="button" className="signedout-btn" onClick={onSignBackIn}>
          Sign back in
        </button>

      </div>

    </div>

  );

}


export default SignedOut;
