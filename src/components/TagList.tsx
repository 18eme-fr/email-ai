export default function TagList({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-salin-line bg-salin-bg-elevated px-3 py-1 text-xs text-salin-fg-muted"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
