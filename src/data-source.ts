import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '123456',
  database: 'test_dev',
  synchronize: false,
  logging: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  poolSize: 10,
  migrations: ['src/migrations/**.ts'],
  connectorPackage: 'mysql2',
});
