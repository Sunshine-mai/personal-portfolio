-- 复建迁移（记录在案的重建版本，非原始字节）
--
-- 背景：本文件曾于 2026-09-02 应用于本地 MySQL，记录于 flyway_schema_history
-- （version=2，description=add revision review status，checksum=472695228，success=true），
-- 但从未提交到 Git，随后从工作区丢失。原始内容不可恢复，故依据该记录的描述与
-- 现存 schema 反推重建。
--
-- 依据：revisions.status 与 idx_revisions_project_status 已存在于 V1 基线中，
-- 因此本迁移对现有库与全新库都必须是幂等的，避免全新环境重复建列失败。
-- 重建版本只保证"结果一致"，不保证与原始文件的字节或校验和一致。

SET @statement = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE revisions ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT ''DRAFT''',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'revisions'
      AND column_name = 'status'
);
PREPARE ensure_revision_status FROM @statement;
EXECUTE ensure_revision_status;
DEALLOCATE PREPARE ensure_revision_status;

SET @statement = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE INDEX idx_revisions_project_status ON revisions (project_id, status)',
        'SELECT 1'
    )
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'revisions'
      AND index_name = 'idx_revisions_project_status'
);
PREPARE ensure_revision_status_index FROM @statement;
EXECUTE ensure_revision_status_index;
DEALLOCATE PREPARE ensure_revision_status_index;
