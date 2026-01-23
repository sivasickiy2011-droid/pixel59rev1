interface NewsSelectionBarProps {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
}

const NewsSelectionBar = ({
  totalCount,
  selectedCount,
  allSelected,
  onToggleSelectAll,
}: NewsSelectionBarProps) => {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          className="w-4 h-4"
        />
        <span>Выбрать все</span>
      </label>
      {selectedCount > 0 && (
        <span>Выбрано: {selectedCount} из {totalCount}</span>
      )}
    </div>
  );
};

export default NewsSelectionBar;

