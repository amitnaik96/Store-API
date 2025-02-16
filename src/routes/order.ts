import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { z } from 'zod';

export const orderRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECRET : string;
    }, 
    Variables : {
        userId : string;
    }
}>();

orderRouter.use('/*', async (c, next) => {
    try{    
        const auth = await c.req.header("Authorization");
        if(!auth || !auth.startsWith('Bearer')){
            throw new Error("invalid/missing token");
        }
        const token = auth.split(' ')[1];
        const decoded = await verify(token, c.env.JWT_SECRET);
        if(!decoded){
            throw new Error("unauthorized!");
        }

        c.set("userId", decoded.id as string);
        await next();
    } catch (err) {
        c.status(411);
        return c.json({
            message : `${err}`
        });
    }
});

orderRouter.post('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const userId = c.get("userId");
        const cart = await prisma.cart.findFirst({
            where : { userId },
            include : {
                items : {
                    include : {
                        product : true
                    }
                }
            }
        });

        if(!cart || cart.items.length === 0){
            throw new Error("Cart is empty.");
        }
        const totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price*item.quantity), 0);
        const order = await prisma.order.create({
            data : {
                userId,
                totalAmount,
                items : {
                    create : cart.items.map(item => ({
                        productId : item.productId,
                        quantity : item.quantity
                    }))
                }
            },
            include : {
                items : {
                    include : {
                        product : true
                    }
                }
            }
        });
        if(!order){
            throw new Error("order was not created!");
        }

        const formattedOrder = {
            id : order.id,
            userId : order.userId,
            totalAmount : order.totalAmount,
            status : order.status,
            createdAt : order.createdAt,
            items : order.items.map(item => ({
                name : item.product.name,
                quantity : item.quantity,
                price : item.product.price
            }))
        }


        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        return c.json({
            order : formattedOrder
        });
    } catch (err) {
        c.status(411);
        return c.json({
            message : `${err}`
        });
    }
});

orderRouter.get('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const userId = c.get("userId");
        const orders = await prisma.order.findMany({
            where : {userId},
            include : {
                items : {
                    include : {
                        product : true
                    }
                }
            }
        });
        if(!orders){
            throw new Error("no orders!");
        }

        const formattedOrders = orders.map(order => ({
            id : order.id,
            userId : order.userId,
            totalAmount : order.totalAmount,
            status : order.status,
            createdAt : order.createdAt,
            items : order.items.map(item => ({
                name : item.product.name,
                quantity : item.quantity,
                price : item.product.price
            }))
        }))

        return c.json({
            orders : formattedOrders
        });
    } catch (err) {
        c.status(411);
        return c.json({
            message : `${err}`
        });
    }
});

const orderStatus = z.object({
    orderId : z.string(),
    status:  z.enum(["PENDING", "DELIVERED", "SHIPPED", "CANCELLED"])
});

orderRouter.post('/status', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const body = await c.req.json();
        const { success } = orderStatus.safeParse(body);
        if(!success){
            throw new Error("invalid inputs!");
        }
        const order = await prisma.order.update({
            where : {id : body.orderId},
            data : {
                status : body.status
            }
        });
        
        c.json({
            order
        });
    } catch (err) {
        c.status(411);
        c.json({
            message : `${err}`
        });
    }
});