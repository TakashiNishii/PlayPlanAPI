import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.ENABLED_ORIGINS?.split(',') ?? 'http://localhost:3000',
  });

  const config = new DocumentBuilder()
    .setTitle('PlayPlan API')
    .setDescription('Documentacao da API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT) || 8080;

  await app.listen(port, '0.0.0.0');
}
bootstrap();
