export async function toggleLike(user_id: string, generation_id: string) {
  const res = await fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, generation_id }),
  });

  return res.json(); 
}

export async function isLiked(user_id: string, generation_id: string) {
  const res = await fetch(`/api/likes?user_id=${user_id}&generation_id=${generation_id}`);
  return res.json();
}