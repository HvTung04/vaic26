import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import type { TaxonomyNode } from "../types";

export interface NodeSearchSelectProps {
  nodes: TaxonomyNode[] | undefined;
  value: string;
  onChange: (nodeId: string) => void;
}

/**
 * Searchable replacement for the plain Topic/Knowledge Node <select>.
 * Matches on content (`noi_dung_cu_the`), topic name, and node id — the
 * curriculum has 50+ nodes, many sharing the same topic name, so a flat
 * dropdown makes the right one hard to find.
 */
export function NodeSearchSelect({ nodes, value, onChange }: NodeSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selected = nodes?.find((n) => n.id === value);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const pool = nodes ?? [];
    if (!term) return pool;
    return pool.filter(
      (n) =>
        (n.noiDungCuThe ?? "").toLowerCase().includes(term) ||
        n.topicName.toLowerCase().includes(term) ||
        n.id.toLowerCase().includes(term),
    );
  }, [nodes, query]);

  function select(node: TaxonomyNode) {
    onChange(node.id);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input
          placeholder="Tìm theo nội dung, chủ đề hoặc mã node..."
          value={isOpen ? query : (selected?.noiDungCuThe ?? selected?.topicName ?? "")}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          onClick={() => {
            // Selecting an item keeps focus on the input (see onMouseDown
            // below), so a second click needs to reopen explicitly — focus
            // won't re-fire onFocus since it never actually blurred.
            setQuery("");
            setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          className="pl-10"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-bento-sm border border-hairline bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-faint">Không tìm thấy node phù hợp.</p>
          ) : (
            results.map((node) => (
              <button
                key={node.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(node)}
                className={cn(
                  "block w-full px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-cream-100",
                  node.id === value && "bg-cream-100",
                )}
              >
                {node.noiDungCuThe ?? node.topicName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
