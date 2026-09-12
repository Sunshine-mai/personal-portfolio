#!/usr/bin/env python3
"""独立复算 Flyway 迁移校验和。

用途：判断迁移文件是否被改动过、以及数据库里记录的校验和是否与仓库文件一致。
这是 ADR-012 的配套控制项：迁移状态一旦不一致，应当能立刻发现，而不是被
ignore-migration-patterns 之类的配置掩盖。

算法（flyway-core ChecksumCalculator）：
    checksum = 0
    逐行读取（去掉行尾换行，首行去掉 BOM）：
        checksum = CRC32.update(checksum, line.encode("utf-8"))
java.util.zip.CRC32.update(int crc, byte[]) 与 zlib.crc32(data, value) 的
"以上一次结果作为输入"约定一致，因此 Python 的 zlib 可以精确复现。

用法：
    python utils/flyway-checksum.py <迁移文件> [更多文件...]
    python utils/flyway-checksum.py --expect 1881988467 <文件>

核对数据库记录：
    Flyway 把校验和写在 flyway_schema_history.checksum。用任意 MySQL 客户端执行
    SELECT version, script, checksum, success FROM flyway_schema_history ORDER BY installed_rank;
    再与上述命令的输出逐项比对。两者不一致即说明迁移文件在应用之后被改动过，
    或仓库缺失了某个已应用的迁移。
"""
import sys
import zlib


def flyway_checksum(text: str) -> int:
    if text.startswith("\ufeff"):
        text = text[1:]
    # BufferedReader.readLine() 按 \n、\r\n 和单独的 \r 分行
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    if lines and lines[-1] == "":
        lines.pop()  # 结尾换行不产生额外一行
    checksum = 0
    for line in lines:
        checksum = zlib.crc32(line.encode("utf-8"), checksum)
    return checksum


def checksum_file(path: str) -> int:
    with open(path, "r", encoding="utf-8", newline="") as handle:
        return flyway_checksum(handle.read())


def main(argv: list[str]) -> int:
    expected = None
    if argv and argv[0] == "--expect":
        if len(argv) < 3:
            print(__doc__)
            return 2
        expected = int(argv[1])
        argv = argv[2:]
    if not argv:
        print(__doc__)
        return 2

    failed = False
    for index, path in enumerate(argv):
        try:
            value = checksum_file(path)
        except OSError as error:
            print(f"[ERROR] {path}: {error}")
            failed = True
            continue
        name = path.replace("\\", "/").split("/")[-1]
        if expected is not None and index == 0:
            ok = value == expected
            print(f"{name}: {value} (期望 {expected}) -> {'一致' if ok else '不一致'}")
            failed = failed or not ok
        else:
            print(f"{name}: {value}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
