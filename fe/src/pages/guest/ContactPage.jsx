export default function ContactPage({ auth, onLogout }) {
  return (
    <div className="card">
      <div className="section-title">
        <div>
          <h2>Contact Us</h2>
          <p className="text-muted">Reach the Inkwell team for partnerships, support, and feedback.</p>
        </div>
      </div>
      <div className="contact-grid">
        <div className="contact-card card">
          <h3>Email</h3>
          <p>hello@inkwell.com</p>
        </div>
        <div className="contact-card card">
          <h3>Office</h3>
          <p>1200 Creative Avenue<br />San Francisco, CA 94107</p>
        </div>
        <div className="contact-card card">
          <h3>Support</h3>
          <p>support@inkwell.com<br />Response within 24 hours</p>
        </div>
      </div>
    </div>
  );
}
