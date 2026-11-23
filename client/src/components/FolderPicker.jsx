export default function FolderPicker({ onSelect, disabled }) {
  return (
    <label className={`picker ${disabled ? 'picker--disabled' : ''}`}>
      <input
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        hidden
        disabled={disabled}
        onChange={(event) => {
          onSelect(event.target.files);
          event.target.value = '';
        }}
      />
      <span className="picker__icon">📁</span>
      <span>Choose your project folder</span>
    </label>
  );
}