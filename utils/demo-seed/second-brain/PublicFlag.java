import java.sql.*;

/**
 * 临时调整 is_public 标记，用于采集不含他人文档的演示截图。
 * 只修改指定 id 的 is_public 字段，不触碰其他任何数据。
 *   dump                  打印当前 is_public 状态
 *   set <0|1> <id,id,..>  把指定文档的 is_public 设为指定值
 */
public class PublicFlag {
    static final String URL = "jdbc:mysql://127.0.0.1:3306/ai-second-brain?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&connectTimeout=4000";
    static final String USER = "root";
    static final String PASS = "040127";

    public static void main(String[] args) throws Exception {
        try (Connection c = DriverManager.getConnection(URL, USER, PASS)) {
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
