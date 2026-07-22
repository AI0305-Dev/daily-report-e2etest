import { formatDate } from "@/lib/utils/date";

type Comment = {
  id: string;
  targetField: "PROBLEM" | "PLAN" | "GENERAL";
  body: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
};

type CommentBlockProps = {
  comments: Comment[];
  targetField: "PROBLEM" | "PLAN" | "GENERAL";
};

export function CommentBlock({ comments, targetField }: CommentBlockProps) {
  const filtered = comments.filter((c) => c.targetField === targetField);
  if (filtered.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {filtered.map((comment) => (
        <div key={comment.id} className="bg-muted/50 border rounded-md px-3 py-2 text-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-muted-foreground text-xs">上長コメント</span>
            <span className="text-xs text-muted-foreground">
              {comment.author.name} · {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{comment.body}</p>
        </div>
      ))}
    </div>
  );
}
