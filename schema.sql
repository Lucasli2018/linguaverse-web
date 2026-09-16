-- LinguaVerse D1 schema (P1: 云端账号与数据同步)
-- 部署：wrangler d1 execute linguaverse --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
  name     TEXT PRIMARY KEY,
  pw_hash  TEXT NOT NULL,            -- 格式: <saltB64>:<pbkdf2Hex>
  created  INTEGER NOT NULL,
  data     TEXT NOT NULL            -- JSON: {xp,days,streak,bestStreak,ach,enrolled,progress,moduleStat}
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  exp   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id    TEXT PRIMARY KEY,
  user  TEXT NOT NULL,
  body  TEXT NOT NULL,
  time  INTEGER NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comments (
  id      TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user    TEXT NOT NULL,
  text    TEXT NOT NULL,
  time    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user    TEXT NOT NULL,
  PRIMARY KEY (post_id, user)
);

CREATE INDEX IF NOT EXISTS idx_posts_time   ON posts(time DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post    ON post_likes(post_id);
