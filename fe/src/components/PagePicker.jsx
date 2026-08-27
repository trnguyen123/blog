export default function PagePicker({ screens, activeScreen, onSelect }) {
  return (
    <div className="page-picker">
      {screens.map((item) => (
        <button key={item.key} className={activeScreen === item.key ? 'active' : ''} onClick={() => onSelect(item.key)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
