import { config } from 'dotenv';
import connectDB from './db/index.js';
config();
import app from './app.js';

const PORT = process.env.PORT || 3001;

connectDB()
  .then((res) => {
    app.listen(PORT, () => {
      console.log(`Server is running on Port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Error connecting DB : ${err}`);
  });
