"use client";

export default function DeleteButton() {
  return (
    <button
      type="submit"
      className="btn-danger text-xs py-1 px-3"
      onClick={(e) => {
        if (!confirm("Delete this book permanently?")) e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}