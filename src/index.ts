import { Hono } from 'hono'
import { userRouter } from './routes/user';
import { productRouter } from './routes/product';
import { cartRouter } from './routes/cart'; 
import { orderRouter } from "./routes/order";

const app = new Hono<{
  Bindings : {
    DATABASE_URL : string;
    JWT_SECRET : string;
  }
}>();

app.get('/', (c) => {
  return c.json({
    message : 'Store API developed by Amit',
    documentation : 'https://github.com/amitnaik96/Store-API/blob/master/README.md'
  });
})

app.route('/api/v1/user', userRouter);
app.route('/api/v1/product', productRouter);
app.route('/api/v1/cart', cartRouter);
app.route('/api/v1/order', orderRouter);

export default app
