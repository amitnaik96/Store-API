import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { z } from 'zod';

export const productRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECRET : string;
    }
}>();

productRouter.use("/*", async (c, next) => {
    try {
        const auth = await c.req.header("Authorization");

        if(!auth || !auth.startsWith('Bearer')){
            throw new Error("missing/invalid token")
        }

        const token = auth.split(' ')[1];
        const decoded = await verify(token, c.env.JWT_SECRET);
        if(!decoded){
            throw new Error("unauthorized!")
        }
        await next();
    } catch (err) {
        c.status(411);
        return c.json({
            message : `${err}`
        });
    }
});

const productSchema = z.object({
    name : z.string(),
    price : z.number(),
    stock : z.number()
});

productRouter.post('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try{
        const body = await c.req.json();
        const { success } = productSchema.safeParse(body);
        if(!success){
            throw new Error("invalid inputs");
        }

        const product = await prisma.product.create({
            data : {...body}
        });
        return c.json({
            product,
            message : "product added succesfully"
        });
    } catch (err) {
        c.status(411);
        return c.json({
            message : `${err}`
        });
    }
});

productRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const products = await prisma.product.findMany({
            take : 10
        });
        return c.json({
            products
        });
    } catch (err) {
        c.status(403);
        return c.json({
            message : `${err}`
        });
    }
})

productRouter.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const id = c.req.param("id");
        const product = await prisma.product.findFirst({
            where : {id}
        });
        return c.json({
            product
        });
    } catch (err) {
        c.status(403);
        return c.json({
            message : `${err}`
        });
    }
})

