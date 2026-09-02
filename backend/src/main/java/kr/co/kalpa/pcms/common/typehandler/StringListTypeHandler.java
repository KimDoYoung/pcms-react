package kr.co.kalpa.pcms.common.typehandler;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import java.sql.Array;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@MappedJdbcTypes(JdbcType.ARRAY)
@MappedTypes(List.class)
public class StringListTypeHandler extends BaseTypeHandler<List<String>> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<String> parameter, JdbcType jdbcType) throws SQLException {
        Connection conn = ps.getConnection();
        Array array = conn.createArrayOf("text", parameter.toArray(new String[0]));
        ps.setArray(i, array);
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return extractList(rs.getArray(columnName));
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return extractList(rs.getArray(columnIndex));
    }

    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return extractList(cs.getArray(columnIndex));
    }

    private List<String> extractList(Array array) throws SQLException {
        if (array == null) {
            return new ArrayList<>();
        }
        Object obj = array.getArray();
        if (obj instanceof String[]) {
            return new ArrayList<>(Arrays.asList((String[]) obj));
        } else if (obj instanceof Object[]) {
            Object[] arr = (Object[]) obj;
            List<String> list = new ArrayList<>(arr.length);
            for (Object item : arr) {
                list.add(item != null ? item.toString() : null);
            }
            return list;
        }
        return new ArrayList<>();
    }
}
