package com.orcific.minutes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.sqlite.SQLiteDataSource;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class SQLiteDataSourceConfig {

    private static final String SQLITE_PREFIX = "jdbc:sqlite:";
    private static final String MEMORY_FALLBACK_URL = "jdbc:sqlite:file:memdb?mode=memory&cache=shared";

    @Bean
    public DataSource dataSource(Environment environment) {
        String url = environment.getProperty("spring.datasource.url");
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("spring.datasource.url must be configured");
        }

        if (isFileBackedSqlite(url)) {
            url = ensureFilePathExists(url);
        }

        SQLiteDataSource dataSource = new SQLiteDataSource();
        dataSource.setUrl(url);
        return dataSource;
    }

    private boolean isFileBackedSqlite(String url) {
        return url.startsWith(SQLITE_PREFIX) && !url.contains("mode=memory");
    }

    private String ensureFilePathExists(String url) {
        try {
            String filePath = url.substring(SQLITE_PREFIX.length());
            if (filePath.startsWith("file:")) {
                int queryIndex = filePath.indexOf('?');
                if (queryIndex > 0) {
                    filePath = filePath.substring(0, queryIndex);
                }
                filePath = filePath.substring("file:".length());
            }

            Path dbPath = Paths.get(filePath);
            Path directory = dbPath.toAbsolutePath().getParent();
            if (directory != null) {
                Files.createDirectories(directory);
                if (!Files.isWritable(directory)) {
                    throw new IOException("Directory is not writable: " + directory);
                }
            }
            return url;
        } catch (IOException ex) {
            return MEMORY_FALLBACK_URL;
        }
    }
}
