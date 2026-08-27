export default function SidebarNav({ items, activeKey, onSelect }) {
  return (
    <div className="sidebar-nav">
      {items.map((item) => (
        <button
          key={item.key || item.label}
          className={activeKey === item.key ? 'active' : ''}
          onClick={() => item.key && onSelect && onSelect(item.key)}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}