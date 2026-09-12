# 采集 Second Brain 截图：临时隔离公共文档，采集后立即还原。
# 仅改动指定文档的 is_public 字段，其他数据不动。
$ErrorActionPreference = 'Continue'
$root = 'C:\maimai\Python\personal-portfolio'
$jar = 'C:\Users\19108\.m2\repository\com\mysql\mysql-connector-j\8.3.0\mysql-connector-j-8.3.0.jar'
$probe = "$root\utils\demo-seed\second-brain"
$ids = '12,35,36'

Write-Host '=== 0. 采集前的公共文档状态（还原依据）==='
& java -cp $jar "$probe\PublicFlag.java" dump

try {
    Write-Host '=== 1. 临时置为私有 ==='
    & java -cp $jar "$probe\PublicFlag.java" set 0 $ids

    Write-Host '=== 2. 采集文档页与对话页 ==='
    & node "$probe\capture-brain.mjs"
} finally {
    Write-Host '=== 3. 无论结果如何都还原为公共 ==='
    & java -cp $jar "$probe\PublicFlag.java" set 1 $ids
    Write-Host '=== 4. 校验还原结果 ==='
    & java -cp $jar "$probe\PublicFlag.java" dump
}
