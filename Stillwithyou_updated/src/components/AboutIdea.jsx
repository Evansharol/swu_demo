export default function AboutIdea() {
  return (
    <div className="about-idea-section">
      <div className="about-idea-glow" aria-hidden="true" />
      <div className="about-idea-inner">
        <div className="about-idea-badge">✨ Our Vision</div>
        <h2 className="about-idea-title">
          Still <em>With You</em>
        </h2>
        <p className="about-idea-tagline">
          Keeping emotional connections alive beyond time and distance.
        </p>
        <div className="about-idea-divider" />
        <p className="about-idea-body">
          <strong>Still With You</strong> is a platform designed to keep emotional connections
          alive beyond time and distance. It allows users to schedule memories, messages,
          and gifts for their loved ones — ensuring that even in absence, their presence
          can still be felt.
        </p>
        <div className="about-idea-features">
          {[
            { icon: '✉️', title: 'Scheduled Messages', desc: 'Write letters delivered at the perfect moment' },
            { icon: '🎁', title: 'Surprise Gifts', desc: 'Send flowers and keepsakes on special occasions' },
            { icon: '🎬', title: 'Digital Memories', desc: 'Store photos, videos, and voice notes forever' },
            { icon: '🌳', title: 'Living Memorial', desc: 'Watch your memory tree grow with every addition' },
          ].map((feature, i) => (
            <div key={i} className="about-feature-card">
              <span className="about-feature-icon">{feature.icon}</span>
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
        <div className="about-idea-quote">
          <span className="about-quote-mark">"</span>
          Even when I'm not there, I'm still with you.
          <span className="about-quote-mark">"</span>
        </div>
      </div>
    </div>
  );
}
