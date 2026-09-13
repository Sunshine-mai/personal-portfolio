import java.sql.*;

/**
 * 临时调整 is_public 标记，用于采集不含他人文档的演示截图。
 * 只修改指定 id 的 is_public 字段，不触碰其他任何数据。
 *   dump                  打印当前 is_public 状态
 *   set <0|1> <id,id,..>  把指定文档的 is_public 设为指定值
 *
 * 连接信息只从环境变量读取，不写死在源码里：源码会进公开仓库，凭据不该跟着进去。
 * 用法示例（PowerShell）：
 *   $env:DB_URL='jdbc:mysql://127.0.0.1:3306/ai-second-brain?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai'
 *   $env:DB_USERNAME='root'
 *   $env:DB_PASSWORD='<本地密码>'
 *   java PublicFlag.java dump
 */
public class PublicFlag {
    public static void main(String[] args) throws Exception {
        String url = requireEnv("DB_URL");
        String user = envOrDefault("DB_USERNAME", envOrDefault("DB_USER", "root"));
        String password = requireEnv("DB_PASSWORD");

        try (Connection c = DriverManager.getConnection(url, user, password)) {
            if (args.length == 0 || "dump".equals(args[0])) {
                dump(c);
                return;
            }
            if ("set".equals(args[0])) {
                int value = Integer.parseInt(args[1]);
                System.out.println("[before]");
                dump(c);
                String[] ids = args[2].split(",");
                StringBuilder sql = new StringBuilder("UPDATE kb_document SET is_public = ? WHERE id IN (");
                for (int i = 0; i < ids.length; i++) {
                    sql.append(i > 0 ? ",?" : "?");
                }
                sql.append(")");
                try (PreparedStatement ps = c.prepareStatement(sql.toString())) {
                    ps.setInt(1, value);
                    for (int i = 0; i < ids.length; i++) {
                        ps.setLong(i + 2, Long.parseLong(ids[i].trim()));
                    }
                    int updated = ps.executeUpdate();
                    System.out.println("[update] is_public=" + value + " affected rows=" + updated);
                }
                System.out.println("[after]");
                dump(c);
                return;
            }
            System.out.println("usage: PublicFlag dump | set <0|1> <id,id,..>");
        }
    }

    /** 缺少必需的环境变量时直接退出并说明缺什么，不要用一个默认值悄悄连上别的库。 */
    static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            System.err.println("缺少环境变量 " + name + "。");
            System.err.println("连接信息不写在源码里，请先注入：DB_URL / DB_USERNAME / DB_PASSWORD");
            System.exit(2);
        }
        return value;
    }

    static String envOrDefault(String name, String fallback) {
        String value = System.getenv(name);
        return (value == null || value.isBlank()) ? fallback : value;
    }

    static void dump(Connection c) throws SQLException {
        try (Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT id, user_id, is_public FROM kb_document WHERE is_public = 1 ORDER BY id")) {
            int count = 0;
            while (rs.next()) {
                System.out.println("  public: id=" + rs.getInt(1) + " user_id=" + rs.getInt(2));
                count++;
            }
            System.out.println("  total public documents = " + count);
        }
    }
}
