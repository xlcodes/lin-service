import { DataSource } from 'typeorm';
import dataSourceConfig from '@/data-source.config';
// import dataSourceConfig from '@/data-source.example.config';

export default new DataSource({
  type: 'mysql',
  host: dataSourceConfig.host,
  port: Number(dataSourceConfig.port),
  username: dataSourceConfig.username,
  password: dataSourceConfig.password,
  database: dataSourceConfig.database,
  synchronize: false,
  logging: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  poolSize: 10,
  migrations: ['src/migrations/**.ts'],
  connectorPackage: 'mysql2',
});
