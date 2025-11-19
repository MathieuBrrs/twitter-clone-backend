import { openDb, pool } from "../config/db.js";

export const updateProfileInfo = async (req, res) => {
  const userId = req.user.id;
  const { bio, avatar_url, cover_url } = req.body;

  try {
    const db = await openDb();

    await db.run(
      "UPDATE users SET bio = $1, avatar_url = $2, cover_url = $3 WHERE id = $4",
      [bio, avatar_url, cover_url, userId]
    );

    const updatedUser = await db.get(
      "SELECT id, username, email, bio, avatar_url, cover_url, created_at FROM users WHERE id = $1",
      [userId]
    );

    res.json({
      message: "Informations du profil mises à jour",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur ou données invalides" });
  }
};
