import { openDb, pool } from "../config/db.js";

export const getCommentsForTweet = async (req, res) => {
  const { tweetId } = req.params;
  try {
    const db = await openDb();
    const comments = await db.all(
      `SELECT 
        c.id,
        c.content,
        c.user_id AS "userId",
        c.tweet_id AS "tweetId",
        c.likes,
        u.username AS author,
        u.avatar_url AS "authorAvatarUrl",
        c.created_at AS "createdAt"
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.tweet_id = $1 
      ORDER BY c.created_at ASC
      `,
      [tweetId]
    );

    res.json(comments);
  } catch (err) {
    console.error("Erreur lors de la récupération des commentaires:", err);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des commentaires",
    });
  }
};

export const createComment = async (req, res) => {
  const { content, tweet_id } = req.body;
  const user_id = req.user.id;
  if (!content || !tweet_id) {
    return res.status(400).json({ error: "Le contenu ou tweet id manquant" });
  }

  const client = await pool.connect(); // Connectez-vous d'abord
  try {
    // 1. Insérer le commentaire et récupérer son ID avec RETURNING id
    const result = await client.query(
      "INSERT INTO comments (content, user_id, tweet_id, likes) VALUES ($1, $2, $3, 0) RETURNING id",
      [content, user_id, tweet_id]
    );
    const newCommentId = result.rows[0].id; // L'ID inséré est dans result.rows[0].id

    // 2. Mettre à jour le compteur du tweet (on utilise 'client.query' ici)
    await client.query(
      "UPDATE tweets SET comments_count = comments_count + 1 WHERE id = $1",
      [tweet_id]
    );

    // 3. Récupérer le nouveau nombre total de commentaires (on utilise 'client.query' ici)
    const updatedTweetResult = await client.query(
      "SELECT comments_count FROM tweets WHERE id = $1",
      [tweet_id]
    );
    const updatedTweet = updatedTweetResult.rows[0]; // Récupérer la première ligne

    res.status(201).json({
      id: newCommentId,
      content,
      userId: user_id,
      tweetId: tweet_id,
      likes: 0,
      authorId: user_id,
      author: req.user.username,
      commentsCount: updatedTweet.comments_count,
      createdAt: new Date().toISOString(),
      authorAvatarUrl: req.user.avatar_url, //|| null,
    });
  } catch (err) {
    console.error("Erreur lors de la création du commentaire:", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création du commentaire" });
  } finally {
    client.release(); // Relâchez le client
  }
};

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const user_id_from_token = req.user.id;

  const client = await pool.connect(); // Utilisez pool.connect() ici aussi
  try {
    // Récupérer le tweet_id avant de supprimer le commentaire
    const tweetInfoResult = await client.query(
      'SELECT tweet_id AS "tweetId" FROM comments WHERE id = $1',
      [commentId]
    );
    const tweetInfo = tweetInfoResult.rows[0];

    if (!tweetInfo) {
      return res.status(404).json({ error: "Commentaire non trouvé" });
    }

    // Vérifier les droits de suppression
    const comment = await client.query(
      'SELECT user_id AS "userId" FROM comments WHERE id = $1',
      [commentId]
    );

    if (
      comment.rows.length === 0 ||
      comment.rows[0].userId !== user_id_from_token
    ) {
      return res.status(403).json({ error: "Action interdite" });
    }

    // Supprimer le commentaire
    await client.query("DELETE FROM comments WHERE id = $1", [commentId]);

    // Décrémenter le compteur de commentaires sur le tweet parent
    await client.query(
      "UPDATE tweets SET comments_count = comments_count - 1 WHERE id = $1",
      [tweetInfo.tweetId]
    );

    res.status(200).json({
      message: "Commentaire supprimé avec succès",
    });
  } catch (err) {
    console.error("Erreur lors de la suppression du commentaire:", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression du commentaire" });
  } finally {
    client.release(); // Relâchez le client
  }
};

export const likeComment = async (req, res) => {
  const { commentId } = req.params;
  const user_id = req.user.id;

  try {
    const db = await openDb();
    await db.run("UPDATE comments SET likes = likes + 1 WHERE id = $1", [
      commentId,
    ]);
    const comment = await db.get("SELECT likes FROM comments WHERE id = $1", [
      commentId,
    ]);

    res.status(200).json({
      message: "Commentaire liké",
      commentId: commentId,
      newLikesCount: comment.likes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du like" });
  }
};
