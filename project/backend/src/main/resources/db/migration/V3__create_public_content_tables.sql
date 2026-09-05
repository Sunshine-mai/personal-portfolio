CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id VARCHAR(100) PRIMARY KEY,
    label VARCHAR(160) NOT NULL,
    category VARCHAR(160) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_summaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_summaries_published_id ON learning_summaries (published, id);
