import { openDb, pool } from "../config/db.js";

export const getUserProfile = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID utilisateur invalide." });
  }

  try {
    const db = await openDb();

    const user = await db.get(
      "SELECT id, username, email, bio, avatar_url, cover_url, created_at FROM users WHERE id = $1",
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const tweets = await db.all(
      `
      SELECT 
        t.id, 
        t.content, 
        t.likes, 
        t.comments_count AS "commentsCount",
        t.user_id AS "authorId", 
        u.username AS author, 
        u.avatar_url AS "authorAvatarUrl", 
        t.created_at AS "createdAt"
      FROM tweets t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `,
      [id]
    );

    res.json({
      user: user,
      tweets: tweets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
