// Confirmation dialog shown before actually signing the user out —
// mirrors the reference design (dark card, X close, Cancel + red
// Sign Out). Rendered at the App level so it overlays the header and
// sidebar too, not just the current page.
function SignOutModal({ open, onCancel, onConfirm }) {

  if (!open) return null;

  return (

    <div className="signout-modal-overlay" onClick={onCancel}>

      <div className="signout-modal-card" onClick={(e) => e.stopPropagation()}>

        <div className="signout-modal-header">
          <h3>Sign out?</h3>
          <button type="button" className="signout-modal-close" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="signout-modal-body">
          Are you sure you want to sign out of your account?
        </p>

        <div className="signout-modal-actions">
          <button type="button" className="signout-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="signout-modal-confirm" onClick={onConfirm}>
            Sign Out
          </button>
        </div>

      </div>

    </div>

  );

}


export default SignOutModal;
