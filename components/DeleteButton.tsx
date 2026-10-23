"use client";

export default function DeleteButton() {
  return (
    <button
      type="submit"
      className="text-sm text-red-600 underline"
      onClick={(e) => {
        if (!confirm("Delete this book permanently?")) e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}