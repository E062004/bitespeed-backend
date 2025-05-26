import express,{Request, Response} from 'express';
import dotenv from 'dotenv';
import identifyRouter from './routes/identify';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get('/', (_req: Request, res: Response): any => {
  return res.json({ message: "Hello" });
});
app.use('/identify', identifyRouter); 


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


