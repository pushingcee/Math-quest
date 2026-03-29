import express from 'express';
import cors from 'cors';
import { problemSetsRouter } from './routes/problem-sets';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/problem-sets', problemSetsRouter);

app.listen(port, () => {
  console.log(`Math Quest API server running on http://localhost:${port}`);
});
