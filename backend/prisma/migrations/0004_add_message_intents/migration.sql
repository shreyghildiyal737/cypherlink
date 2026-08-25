-- Extend MessageIntent with new categories (beat sharing, vocal/producer searches)
ALTER TYPE "MessageIntent" ADD VALUE IF NOT EXISTS 'BEAT_SHARE';
ALTER TYPE "MessageIntent" ADD VALUE IF NOT EXISTS 'NEED_VOCALS';
ALTER TYPE "MessageIntent" ADD VALUE IF NOT EXISTS 'LOOKING_FOR_PRODUCER';
