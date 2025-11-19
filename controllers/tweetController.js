import { openDb, pool } from "../config/db.js";

export const getTweets = async (req, res) => {
  try {
    const db = await openDb();

    const tweets = await db.all(
      `SELECT 
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
      ORDER BY t.created_at DESC`
    );

    res.json(tweets);
  } catch (err) {
    console.error("Erreur lors de la récupération des tweets:", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des tweets" });
  }
};

export const createTweet = async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Le contenu est requis" });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO tweets (content, user_id, likes, comments_count) VALUES ($1, $2, 0, 0) RETURNING id",
      [content, req.user.id]
    );
    const newTweetId = result.rows[0].id;

    const db = await openDb();
    const newTweet = await db.get(
      `
      SELECT
        t.id,
        t.content,
        t.likes,
        t.comments_count AS "commentsCount",
        t.user_id AS "authorId",
        t.created_at AS "createdAt",
        u.username AS author,
        u.avatar_url AS "authorAvatarUrl"
      FROM tweets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `,
      [newTweetId]
    );

    res.status(201).json(newTweet);
  } catch (err) {
    console.error("Erreur lors de la création du tweet:", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création du tweet" });
  } finally {
    client.release();
  }
};

export const deleteTweet = async (req, res) => {
  try {
    const db = await openDb();

    const tweet = await db.get("SELECT user_id FROM tweets WHERE id = $1", [
      req.params.id,
    ]);

    if (!tweet) {
      return res.status(404).json({ error: "Tweet non trouvé" });
    }

    if (tweet.user_id !== req.user.id) {
      return res.status(403).json({ error: "Action interdite" });
    }

    await db.run("DELETE FROM tweets WHERE id = $1", [req.params.id]);
    res.json({ message: "Tweet supprimé" });
  } catch (err) {
    console.error("Erreur lors de la suppression du tweet:", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression du tweet" });
  }
};

export const getTweetById = async (req, res) => {
  const { id } = req.params;

  try {
    const db = await openDb();

    const tweet = await db.get(
      `
        SELECT
          t.id,
          t.content,
          t.likes,
          t.comments_count AS "commentsCount",
          t.user_id AS "authorId",
          t.created_at AS "createdAt",
          u.username AS author,
          u.avatar_url AS "authorAvatarUrl" 
        FROM tweets t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1
      `,
      [id]
    );

    if (!tweet) {
      return res.status(404).json({ error: "Tweet non trouvé" });
    }

    res.json(tweet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const likeTweet = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const db = await openDb();

    await db.run("UPDATE tweets SET likes = likes + 1 WHERE id = $1", [id]);

    const tweet = await db.get("SELECT likes FROM tweets WHERE id = $1", [id]);

    res.status(200).json({
      message: "Tweet liké",
      tweetId: id,
      newLikesCount: tweet.likes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du like" });
  }
};
