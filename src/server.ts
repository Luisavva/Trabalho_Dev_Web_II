import 'dotenv/config';
import { createApp } from './app';

const app = createApp();
const port = Number(process.env.PORT ?? 3333);

app.listen(port, () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);
});
